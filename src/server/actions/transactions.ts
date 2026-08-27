"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getFee, computeFeeAmountCents } from "@/lib/fees";
import { recalculateVerificationLevel } from "./auth";
import type { ActionResult } from "./auth";

/**
 * Records that a transaction happened OFFLINE between buyer and seller. BikeFair never processes
 * the bicycle's purchase price — this only creates a record once both sides independently confirm,
 * and (separately) applies the marketplace's own seller closing fee, which is a website fee, not
 * part of the bicycle price.
 */
export async function confirmTransactionAction(conversationId: string, agreedPrice?: number): Promise<ActionResult<{ completed: boolean }>> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { listing: true } });
  if (!conversation) return { ok: false, error: "Conversation not found." };
  if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) return { ok: false, error: "Not authorized." };

  const isBuyer = conversation.buyerId === user.id;
  const agreedPriceCents = agreedPrice ? Math.round(agreedPrice * 100) : conversation.listing.askingPrice;

  let transaction = await prisma.transaction.findUnique({ where: { listingId: conversation.listingId } });
  if (!transaction) {
    transaction = await prisma.transaction.create({
      data: {
        listingId: conversation.listingId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        agreedPrice: agreedPriceCents,
      },
    });
  }

  const data: { buyerConfirmedAt?: Date; sellerConfirmedAt?: Date } = {};
  if (isBuyer) data.buyerConfirmedAt = new Date();
  else data.sellerConfirmedAt = new Date();

  transaction = await prisma.transaction.update({ where: { id: transaction.id }, data });

  const bothConfirmed = !!transaction.buyerConfirmedAt && !!transaction.sellerConfirmedAt;
  if (bothConfirmed && transaction.status !== "COMPLETED") {
    const closingFee = await getFee("SELLER_CLOSING");
    const feeAmount = closingFee.isActive ? computeFeeAmountCents(closingFee, transaction.agreedPrice) : 0;

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "COMPLETED", sellerClosingFeeCents: feeAmount },
      }),
      prisma.bikeListing.update({ where: { id: conversation.listingId }, data: { status: "SOLD", soldAt: new Date() } }),
      ...(feeAmount > 0
        ? [
            prisma.paymentRecord.create({
              data: { userId: transaction.sellerId, transactionId: transaction.id, feeType: "SELLER_CLOSING", amountCents: feeAmount, status: "SUCCEEDED", provider: "stub" },
            }),
          ]
        : []),
    ]);

    await recalculateVerificationLevel(transaction.buyerId);
    await recalculateVerificationLevel(transaction.sellerId);
  } else if (!transaction.status.includes("COMPLETED")) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: isBuyer ? "BUYER_CONFIRMED" : "SELLER_CONFIRMED" },
    });
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/account/transactions");
  revalidatePath(`/bike/${conversation.listingId}`);
  return { ok: true, data: { completed: bothConfirmed } };
}
