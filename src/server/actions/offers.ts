"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { dollarsInputToCents, formatCents } from "@/lib/constants";
import type { ActionResult } from "./auth";

export async function makeOfferAction(conversationId: string, amount: number, message?: string): Promise<ActionResult> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.buyerId !== user.id) return { ok: false, error: "Not authorized." };

  const amountCents = dollarsInputToCents(amount);
  if (amountCents <= 0) return { ok: false, error: "Enter a valid offer amount." };

  const offer = await prisma.offer.create({
    data: { conversationId, listingId: conversation.listingId, buyerId: user.id, amount: amountCents, message: message || null },
  });

  await prisma.message.create({
    data: {
      conversationId,
      senderId: user.id,
      body: `Made an offer: ${formatCents(amountCents)}${message ? ` — "${message}"` : ""}`,
    },
  });

  revalidatePath(`/messages/${conversationId}`);
  return { ok: true, data: { offerId: offer.id } as unknown as undefined };
}

export async function respondToOfferAction(offerId: string, accept: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const offer = await prisma.offer.findUnique({ include: { conversation: true }, where: { id: offerId } });
  if (!offer) return { ok: false, error: "Offer not found." };
  if (offer.conversation.sellerId !== user.id) return { ok: false, error: "Not authorized." };
  if (offer.status !== "PENDING") return { ok: false, error: "This offer has already been responded to." };

  await prisma.offer.update({ where: { id: offerId }, data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } });
  await prisma.message.create({
    data: {
      conversationId: offer.conversationId,
      senderId: user.id,
      body: accept ? `Accepted the offer of ${formatCents(offer.amount)}.` : `Declined the offer of ${formatCents(offer.amount)}.`,
    },
  });

  if (accept) {
    await prisma.bikeListing.update({ where: { id: offer.listingId }, data: { status: "PENDING" } });
  }

  revalidatePath(`/messages/${offer.conversationId}`);
  return { ok: true };
}

export async function withdrawOfferAction(offerId: string): Promise<ActionResult> {
  const user = await requireUser();
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.buyerId !== user.id) return { ok: false, error: "Not authorized." };
  if (offer.status !== "PENDING") return { ok: false, error: "This offer can no longer be withdrawn." };
  await prisma.offer.update({ where: { id: offerId }, data: { status: "WITHDRAWN", respondedAt: new Date() } });
  revalidatePath(`/messages/${offer.conversationId}`);
  return { ok: true };
}
