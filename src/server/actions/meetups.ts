"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { meetupSchema } from "@/lib/validation";
import { MEETUP_TYPE_LABELS, type MeetupType } from "@/lib/constants";
import type { ActionResult } from "./auth";

export async function proposeMeetupAction(conversationId: string, input: unknown): Promise<ActionResult<{ meetupId: string }>> {
  const user = await requireUser();
  const parsed = meetupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid meetup details." };

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.buyerId !== user.id && conversation.sellerId !== user.id)) {
    return { ok: false, error: "Not authorized." };
  }

  const data = parsed.data;
  const meetup = await prisma.meetup.create({
    data: {
      conversationId,
      type: data.type,
      bikeShopId: data.type === "BIKE_SHOP" ? data.bikeShopId || null : null,
      safeExchangeLocationId: data.type === "LAW_ENFORCEMENT" ? data.safeExchangeLocationId || null : null,
      locationName: data.locationName,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      inspectionRequested: !!data.inspectionRequested,
      notes: data.notes || null,
    },
  });

  if (data.bikeShopId && data.type === "BIKE_SHOP") {
    await prisma.bikeShop.update({ where: { id: data.bikeShopId }, data: { meetupCount: { increment: 1 } } });
  }
  if (data.safeExchangeLocationId && data.type === "LAW_ENFORCEMENT") {
    await prisma.safeExchangeLocation.update({ where: { id: data.safeExchangeLocationId }, data: { meetupCount: { increment: 1 } } });
  }

  await prisma.message.create({
    data: {
      conversationId,
      senderId: user.id,
      body: `Proposed a meetup — ${MEETUP_TYPE_LABELS[data.type as MeetupType]}: ${data.locationName}${
        data.scheduledAt ? ` on ${new Date(data.scheduledAt).toLocaleString()}` : ""
      }`,
    },
  });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/meetups");
  return { ok: true, data: { meetupId: meetup.id } };
}

export async function confirmMeetupAction(meetupId: string): Promise<ActionResult> {
  const user = await requireUser();
  const meetup = await prisma.meetup.findUnique({ where: { id: meetupId }, include: { conversation: true } });
  if (!meetup || (meetup.conversation.buyerId !== user.id && meetup.conversation.sellerId !== user.id)) {
    return { ok: false, error: "Not authorized." };
  }
  await prisma.meetup.update({ where: { id: meetupId }, data: { status: "CONFIRMED" } });
  revalidatePath("/meetups");
  revalidatePath(`/messages/${meetup.conversationId}`);
  return { ok: true };
}

export async function cancelMeetupAction(meetupId: string): Promise<ActionResult> {
  const user = await requireUser();
  const meetup = await prisma.meetup.findUnique({ where: { id: meetupId }, include: { conversation: true } });
  if (!meetup || (meetup.conversation.buyerId !== user.id && meetup.conversation.sellerId !== user.id)) {
    return { ok: false, error: "Not authorized." };
  }
  await prisma.meetup.update({ where: { id: meetupId }, data: { status: "CANCELLED" } });
  revalidatePath("/meetups");
  return { ok: true };
}
