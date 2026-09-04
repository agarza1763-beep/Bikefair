"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "./auth";

export async function updateProfilePhotoAction(imageUrl: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!imageUrl.trim()) return { ok: false, error: "No photo provided." };
  await prisma.user.update({ where: { id: user.id }, data: { image: imageUrl } });
  revalidatePath("/account");
  revalidatePath("/sell/create");
  revalidatePath("/messages");
  return { ok: true };
}
