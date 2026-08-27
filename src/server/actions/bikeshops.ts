"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { geocode } from "@/lib/geo";
import { bikeShopSchema } from "@/lib/validation";
import type { ActionResult } from "./auth";

/**
 * Public self-serve shop signup (see /bike-shops/join). Creates the shop as PENDING — it does not
 * appear on the public directory or as a selectable meetup location until an admin reviews and
 * approves it (see approveBikeShopMembershipAction in admin.ts). No payment is actually collected
 * here — see the disclaimer on the join page and the README for why.
 */
export async function submitBikeShopSignupAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = bikeShopSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid shop details." };
  const data = parsed.data;

  const existing = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id } });
  if (existing) return { ok: false, error: "You already have a bike shop associated with your account." };

  const point = await geocode(data.city, data.state);

  const shop = await prisma.bikeShop.create({
    data: {
      ownerUserId: user.id,
      name: data.name,
      description: data.description || null,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip || null,
      lat: point.lat,
      lng: point.lng,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      offersInspection: !!data.offersInspection,
      inspectionFeeCents: data.offersInspection && data.inspectionFee ? Math.round(data.inspectionFee * 100) : null,
      isVerified: false,
      isDemo: false,
      membershipStatus: "PENDING",
    },
  });

  revalidatePath("/admin/bike-shops");
  return { ok: true, data: { id: shop.id } };
}
