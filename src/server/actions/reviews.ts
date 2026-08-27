"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validation";
import { recalculateVerificationLevel } from "./auth";
import type { ActionResult } from "./auth";

export async function submitReviewAction(transactionId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction || transaction.status !== "COMPLETED") return { ok: false, error: "Reviews can only be left on completed transactions." };
  if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) return { ok: false, error: "Not authorized." };

  const revieweeId = transaction.buyerId === user.id ? transaction.sellerId : transaction.buyerId;

  const existing = await prisma.review.findUnique({ where: { transactionId_reviewerId: { transactionId, reviewerId: user.id } } });
  if (existing) return { ok: false, error: "You've already reviewed this transaction." };

  await prisma.review.create({
    data: { transactionId, reviewerId: user.id, revieweeId, ...parsed.data },
  });

  await recalculateVerificationLevel(revieweeId);
  revalidatePath("/account/reviews");
  revalidatePath("/account/transactions");
  return { ok: true };
}
