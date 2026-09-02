"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { geocode } from "@/lib/geo";
import { bikeShopSchema, safeExchangeLocationSchema } from "@/lib/validation";
import { getFee } from "@/lib/fees";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { dollarsInputToCents, type FeeType } from "@/lib/constants";
import type { ActionResult } from "./auth";

async function logAdminAction(adminId: string, actionType: string, targetType: string, targetId: string, notes?: string) {
  await prisma.adminAction.create({ data: { adminId, actionType, targetType, targetId, notes } });
}

export async function suspendUserAction(userId: string, suspended: boolean, notes?: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: suspended } });
  await logAdminAction(admin.id, suspended ? "SUSPEND_USER" : "REINSTATE_USER", "USER", userId, notes);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function adminRemoveListingAction(listingId: string, notes?: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.bikeListing.update({ where: { id: listingId }, data: { status: "REMOVED" } });
  await logAdminAction(admin.id, "REMOVE_LISTING", "LISTING", listingId, notes);
  revalidatePath("/admin/listings");
  revalidatePath("/browse");
  return { ok: true };
}

export async function resolveReportAction(reportId: string, status: "RESOLVED" | "DISMISSED" | "IN_REVIEW", adminNotes?: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.report.update({
    where: { id: reportId },
    data: { status, adminNotes, resolvedById: status === "RESOLVED" || status === "DISMISSED" ? admin.id : undefined, resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : undefined },
  });
  await logAdminAction(admin.id, "RESOLVE_REPORT", "REPORT", reportId, adminNotes);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function updateSerialReviewAction(
  serialReviewId: string,
  status: "NOT_VERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "POTENTIAL_ISSUE" | "REVIEW_REQUIRED",
  adminNotes?: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const review = await prisma.serialNumberReview.update({
    where: { id: serialReviewId },
    data: { status, adminNotes, reviewedById: admin.id, reviewedAt: new Date() },
  });
  await prisma.bikeListing.update({ where: { id: review.listingId }, data: { serialStatus: status } });
  await logAdminAction(admin.id, "FLAG_SERIAL", "SERIAL", serialReviewId, adminNotes);
  revalidatePath("/admin/serial-numbers");
  revalidatePath(`/bike/${review.listingId}`);
  return { ok: true };
}

export async function toggleFeaturedAction(listingId: string, isFeatured: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.bikeListing.update({ where: { id: listingId }, data: { isFeatured } });
  await logAdminAction(admin.id, "TOGGLE_FEATURED", "LISTING", listingId, `featured=${isFeatured}`);
  revalidatePath("/admin/listings");
  revalidatePath("/");
  return { ok: true };
}

export async function updateFeeAction(type: FeeType, amountCents: number, isPercentage: boolean, isActive: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.fee.upsert({
    where: { type },
    update: { amountCents, isPercentage, isActive },
    create: { type, name: type, amountCents, isPercentage, isActive },
  });
  await logAdminAction(admin.id, "UPDATE_FEE", "FEE", type, `amount=${amountCents} pct=${isPercentage} active=${isActive}`);
  revalidatePath("/admin/fees");
  return { ok: true };
}

export async function upsertValuationRuleAction(key: string, value: number, isActive: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  const rule = await prisma.valuationRule.findUnique({ where: { key } });
  if (!rule) return { ok: false, error: "Unknown rule key." };
  await prisma.valuationRule.update({ where: { key }, data: { value, isActive } });
  await logAdminAction(admin.id, "UPDATE_VALUATION_RULE", "VALUATION_RULE", key, `value=${value} active=${isActive}`);
  revalidatePath("/admin/valuation-rules");
  return { ok: true };
}

export async function upsertBikeShopAction(bikeShopId: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = bikeShopSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid bike shop details." };
  const data = parsed.data;

  const point = await geocode(data.city, data.state);
  const shopData = {
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
    inspectionFeeCents: data.offersInspection && data.inspectionFee ? dollarsInputToCents(data.inspectionFee) : null,
    isVerified: !!data.isVerified,
    hoursJson: data.hours ? JSON.stringify(data.hours) : null,
  };

  const shop = bikeShopId
    ? await prisma.bikeShop.update({ where: { id: bikeShopId }, data: shopData })
    : await prisma.bikeShop.create({ data: shopData });

  await logAdminAction(admin.id, bikeShopId ? "UPDATE_BIKE_SHOP" : "CREATE_BIKE_SHOP", "BIKE_SHOP", shop.id, data.name);
  revalidatePath("/admin/bike-shops");
  revalidatePath("/bike-shops");
  revalidatePath(`/bike-shops/${shop.id}`);
  return { ok: true, data: { id: shop.id } };
}

export async function linkBikeShopOwnerAction(bikeShopId: string, userId: string | null): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.bikeShop.update({ where: { id: bikeShopId }, data: { ownerUserId: userId } });
  await logAdminAction(admin.id, "LINK_BIKE_SHOP_OWNER", "BIKE_SHOP", bikeShopId, userId ?? "unlinked");
  revalidatePath("/admin/bike-shops");
  return { ok: true };
}

export async function upsertSafeExchangeLocationAction(locationId: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = safeExchangeLocationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid location details." };
  const data = parsed.data;

  const point = await geocode(data.city, data.state);
  const locationData = {
    name: data.name,
    agencyType: data.agencyType,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip || null,
    lat: point.lat,
    lng: point.lng,
    phone: data.phone || null,
    notes: data.notes || null,
    isActive: data.isActive ?? true,
  };

  const location = locationId
    ? await prisma.safeExchangeLocation.update({ where: { id: locationId }, data: locationData })
    : await prisma.safeExchangeLocation.create({ data: locationData });

  await logAdminAction(admin.id, locationId ? "UPDATE_SAFE_EXCHANGE_LOCATION" : "CREATE_SAFE_EXCHANGE_LOCATION", "SAFE_EXCHANGE_LOCATION", location.id, data.name);
  revalidatePath("/admin/safe-exchange-locations");
  revalidatePath("/safe-exchange-locations");
  return { ok: true, data: { id: location.id } };
}

export async function deleteSafeExchangeLocationAction(locationId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const location = await prisma.safeExchangeLocation.findUnique({ where: { id: locationId } });
  if (!location) return { ok: false, error: "Location not found." };
  await prisma.safeExchangeLocation.delete({ where: { id: locationId } });
  await logAdminAction(admin.id, "DELETE_SAFE_EXCHANGE_LOCATION", "SAFE_EXCHANGE_LOCATION", locationId, location.name);
  revalidatePath("/admin/safe-exchange-locations");
  revalidatePath("/safe-exchange-locations");
  return { ok: true };
}

/**
 * Approves a pending shop-partner signup: marks membership ACTIVE, verifies the shop (so it
 * appears on the public directory and as a selectable meetup location), and logs a stub payment
 * record for the first month's $25 fee. No real charge occurs — see README for the payments gap.
 */
export async function approveBikeShopMembershipAction(bikeShopId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const shop = await prisma.bikeShop.findUnique({ where: { id: bikeShopId } });
  if (!shop) return { ok: false, error: "Shop not found." };
  if (!shop.ownerUserId) return { ok: false, error: "This shop has no linked owner account to bill." };

  const fee = await getFee("BIKE_SHOP_MEMBERSHIP");

  await prisma.$transaction([
    prisma.bikeShop.update({
      where: { id: bikeShopId },
      data: { membershipStatus: "ACTIVE", isVerified: true, membershipApprovedAt: new Date() },
    }),
    prisma.paymentRecord.create({
      data: {
        userId: shop.ownerUserId,
        bikeShopId: shop.id,
        feeType: "BIKE_SHOP_MEMBERSHIP",
        amountCents: fee.amountCents,
        status: "SUCCEEDED",
        provider: "stub",
      },
    }),
  ]);

  await logAdminAction(admin.id, "APPROVE_BIKE_SHOP_MEMBERSHIP", "BIKE_SHOP", bikeShopId);
  revalidatePath("/admin/bike-shops");
  revalidatePath("/bike-shops");
  return { ok: true };
}

export async function cancelBikeShopMembershipAction(bikeShopId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const shop = await prisma.bikeShop.findUnique({ where: { id: bikeShopId } });
  if (shop?.stripeSubscriptionId && isStripeConfigured()) {
    await getStripe()
      .subscriptions.cancel(shop.stripeSubscriptionId)
      .catch(() => {}); // already cancelled or otherwise gone — proceed with the local state change regardless
  }
  await prisma.bikeShop.update({ where: { id: bikeShopId }, data: { membershipStatus: "CANCELLED", isVerified: false } });
  await logAdminAction(admin.id, "CANCEL_BIKE_SHOP_MEMBERSHIP", "BIKE_SHOP", bikeShopId);
  revalidatePath("/admin/bike-shops");
  revalidatePath("/bike-shops");
  return { ok: true };
}

export async function verifyBikeShopAction(bikeShopId: string, verified: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.bikeShop.update({ where: { id: bikeShopId }, data: { isVerified: verified } });
  await logAdminAction(admin.id, "VERIFY_BIKE_SHOP", "BIKE_SHOP", bikeShopId);
  revalidatePath("/admin/bike-shops");
  revalidatePath("/bike-shops");
  return { ok: true };
}

export async function addRecognizedBrandAction(name: string, notes?: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a brand name." };

  const existing = await prisma.recognizedBrand.findUnique({ where: { name: trimmed } });
  if (existing) {
    if (existing.isActive) return { ok: false, error: "That brand is already on the recognized list." };
    await prisma.recognizedBrand.update({ where: { id: existing.id }, data: { isActive: true, notes: notes || existing.notes } });
  } else {
    await prisma.recognizedBrand.create({ data: { name: trimmed, notes: notes || null } });
  }

  await logAdminAction(admin.id, "ADD_RECOGNIZED_BRAND", "RECOGNIZED_BRAND", trimmed, notes);
  revalidatePath("/admin/recognized-brands");
  revalidatePath("/browse");
  return { ok: true };
}

export async function toggleRecognizedBrandAction(id: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.recognizedBrand.update({ where: { id }, data: { isActive } });
  await logAdminAction(admin.id, "TOGGLE_RECOGNIZED_BRAND", "RECOGNIZED_BRAND", id, `active=${isActive}`);
  revalidatePath("/admin/recognized-brands");
  revalidatePath("/browse");
  return { ok: true };
}

export async function removeRecognizedBrandAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.recognizedBrand.delete({ where: { id } });
  await logAdminAction(admin.id, "REMOVE_RECOGNIZED_BRAND", "RECOGNIZED_BRAND", id);
  revalidatePath("/admin/recognized-brands");
  revalidatePath("/browse");
  return { ok: true };
}
