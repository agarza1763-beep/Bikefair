"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "./auth";

export async function toggleSavedListingAction(listingId: string): Promise<ActionResult<{ saved: boolean }>> {
  const user = await requireUser();
  const existing = await prisma.savedListing.findUnique({ where: { userId_listingId: { userId: user.id, listingId } } });

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } });
    revalidatePath("/saved");
    revalidatePath(`/bike/${listingId}`);
    return { ok: true, data: { saved: false } };
  }

  await prisma.savedListing.create({ data: { userId: user.id, listingId } });
  revalidatePath("/saved");
  revalidatePath(`/bike/${listingId}`);
  return { ok: true, data: { saved: true } };
}
