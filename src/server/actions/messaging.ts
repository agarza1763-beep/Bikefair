"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { messageSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "./auth";

async function assertNotBlocked(userAId: string, userBId: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  if (block) throw new Error("You can't message this user.");
}

export async function startConversationAction(listingId: string, body: string): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const user = await requireUser();
    const rateLimit = checkRateLimit(`message:${user.id}`, { limit: 30, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.ok) return { ok: false, error: rateLimit.error };

    const parsed = messageSchema.safeParse({ body });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };

    const listing = await prisma.bikeListing.findUnique({ where: { id: listingId } });
    if (!listing) return { ok: false, error: "Listing not found." };
    if (listing.sellerId === user.id) return { ok: false, error: "You can't message yourself about your own listing." };

    await assertNotBlocked(user.id, listing.sellerId);

    const conversation = await prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId, buyerId: user.id } },
      update: {},
      create: { listingId, buyerId: user.id, sellerId: listing.sellerId },
    });

    await prisma.message.create({ data: { conversationId: conversation.id, senderId: user.id, body: parsed.data.body } });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    revalidatePath("/messages");
    return { ok: true, data: { conversationId: conversation.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not send message." };
  }
}

export async function sendMessageAction(conversationId: string, body: string, isQuickMessage = false): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const rateLimit = checkRateLimit(`message:${user.id}`, { limit: 30, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.ok) return { ok: false, error: rateLimit.error };

    const parsed = messageSchema.safeParse({ body });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.buyerId !== user.id && conversation.sellerId !== user.id)) {
      return { ok: false, error: "Not authorized." };
    }
    const otherUserId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;
    await assertNotBlocked(user.id, otherUserId);

    await prisma.message.create({ data: { conversationId, senderId: user.id, body: parsed.data.body, isQuickMessage } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    revalidatePath(`/messages/${conversationId}`);
    revalidatePath("/messages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not send message." };
  }
}

export async function markConversationReadAction(conversationId: string): Promise<ActionResult> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.buyerId !== user.id && conversation.sellerId !== user.id)) {
    return { ok: false, error: "Not authorized." };
  }
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function blockUserAction(userId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (user.id === userId) return { ok: false, error: "You can't block yourself." };
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    update: {},
    create: { blockerId: user.id, blockedId: userId },
  });
  revalidatePath("/messages");
  return { ok: true };
}
