"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { listingWizardSchema, type ListingWizardInput } from "@/lib/validation";
import { getValuationEngine } from "@/lib/valuation/engine";
import type { ValuationInput } from "@/lib/valuation/types";
import { geocode } from "@/lib/geo";
import { dollarsInputToCents, type BikeCategory, type Condition, type FrameMaterial, type MileageLevel, type US_STATES } from "@/lib/constants";
import type { ActionResult } from "./auth";

function toValuationInput(input: ListingWizardInput): ValuationInput {
  return {
    category: input.category,
    brand: input.brand,
    model: input.model,
    year: input.year,
    frameMaterial: input.frameMaterial,
    groupset: input.groupset || null,
    wheelset: input.wheelset || null,
    wheelsUpgraded: !!input.wheelsUpgraded,
    condition: input.condition,
    mileageLevel: input.mileageLevel ?? null,
    originalMsrpCents: input.originalMsrp ? dollarsInputToCents(input.originalMsrp) : null,
    upgrades: input.upgrades || null,
    state: input.state,
    askingPriceCents: dollarsInputToCents(input.askingPrice),
  };
}

/** Used by the sell wizard's "Fair Value" step to preview an estimate before publishing. */
export async function previewValuationAction(partial: Partial<ListingWizardInput>) {
  if (!partial.category || !partial.brand || !partial.year || !partial.frameMaterial || !partial.condition || !partial.askingPrice) {
    return { ok: false as const, error: "Missing required fields for a valuation estimate." };
  }
  const engine = getValuationEngine();
  const result = await engine.estimate(toValuationInput(partial as ListingWizardInput));
  return { ok: true as const, data: result };
}

export interface StandaloneValuationInput {
  category: BikeCategory;
  brand: string;
  model?: string;
  year: number;
  frameMaterial: FrameMaterial;
  groupset?: string;
  wheelset?: string;
  wheelsUpgraded?: boolean;
  condition: Condition;
  mileageLevel?: MileageLevel;
  originalMsrp?: string;
  state?: (typeof US_STATES)[number];
}

/** Used by the standalone "Check Your Bike's Value" tool — no listing, no asking price, no sign-in required. */
export async function previewStandaloneValuationAction(input: StandaloneValuationInput) {
  const engine = getValuationEngine();
  const result = await engine.estimate({
    category: input.category,
    brand: input.brand,
    model: input.model || "",
    year: input.year,
    frameMaterial: input.frameMaterial,
    groupset: input.groupset || null,
    wheelset: input.wheelset || null,
    wheelsUpgraded: !!input.wheelsUpgraded,
    condition: input.condition,
    mileageLevel: input.mileageLevel ?? null,
    originalMsrpCents: input.originalMsrp ? dollarsInputToCents(input.originalMsrp) : null,
    upgrades: null,
    state: input.state,
    askingPriceCents: 0,
  });
  return { ok: true as const, data: result };
}

export async function createListingAction(input: ListingWizardInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!user.image) return { ok: false, error: "Add a profile photo to your account before creating a listing — this helps buyers know who they're dealing with." };
  const parsed = listingWizardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid listing data." };
  const data = parsed.data;

  const point = await geocode(data.city, data.state);
  const askingPriceCents = dollarsInputToCents(data.askingPrice);
  const originalMsrpCents = data.originalMsrp ? dollarsInputToCents(data.originalMsrp) : null;
  const ownedShop = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id }, select: { isVerified: true } });
  // Shop sellers choose per-listing whether it's new retail stock (no fair-value badge — that
  // logic is built for pricing used bikes) or a used bike they acquired, e.g. via trade-in (shows
  // fair value like any other used listing, since that's genuinely what it is).
  const isShopInventory = !!ownedShop?.isVerified && data.isNewInventory !== false;

  const listing = await prisma.bikeListing.create({
    data: {
      sellerId: user.id,
      isShopInventory,
      title: `${data.year} ${data.brand} ${data.model}`,
      category: data.category,
      brand: data.brand,
      model: data.model,
      year: data.year,
      frameSize: data.frameSize,
      wheelSize: data.wheelSize || null,
      color: data.color || null,
      frameMaterial: data.frameMaterial,
      groupset: data.groupset || null,
      brakeType: data.brakeType || null,
      suspension: data.suspension || null,
      wheelset: data.wheelset || null,
      wheelsUpgraded: !!data.wheelsUpgraded,
      mileageLevel: data.mileageLevel ?? null,
      condition: data.condition,
      description: data.description,
      upgrades: data.upgrades || null,
      originalMsrp: originalMsrpCents,
      serialNumber: data.serialNumber || null,
      serialStatus: data.serialNumber ? "PENDING_REVIEW" : "NOT_SUBMITTED",
      askingPrice: askingPriceCents,
      status: "ACTIVE",
      city: data.city,
      state: data.state,
      zip: data.zip || null,
      lat: point.lat,
      lng: point.lng,
      prefersPublicMeetup: data.prefersPublicMeetup ?? true,
      prefersBikeShopMeetup: data.prefersBikeShopMeetup ?? true,
      prefersLawEnforcement: data.prefersLawEnforcement ?? false,
      meetupNotes: data.meetupNotes || null,
      publishedAt: new Date(),
      images: { create: data.images.map((url, i) => ({ url, position: i })) },
    },
  });

  if (data.serialNumber) {
    await prisma.serialNumberReview.create({ data: { listingId: listing.id, status: "PENDING_REVIEW" } });
  }

  const engine = getValuationEngine();
  const result = await engine.estimate(toValuationInput(data));
  await prisma.bikeValuation.create({
    data: {
      listingId: listing.id,
      estimatedLow: result.estimatedLowCents,
      estimatedMid: result.estimatedMidCents,
      estimatedHigh: result.estimatedHighCents,
      askingPriceSnapshot: result.askingPriceCents,
      pricePositionPct: result.pricePositionPct,
      pricePositionLabel: result.pricePositionLabel,
      breakdown: JSON.stringify(result.breakdown),
      engineVersion: result.engineVersion,
    },
  });

  revalidatePath("/browse");
  revalidatePath("/account/listings");
  return { ok: true, data: { id: listing.id } };
}

export async function markListingSoldAction(listingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const listing = await prisma.bikeListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return { ok: false, error: "Not authorized." };
  await prisma.bikeListing.update({ where: { id: listingId }, data: { status: "SOLD", soldAt: new Date() } });
  revalidatePath(`/bike/${listingId}`);
  revalidatePath("/account/listings");
  return { ok: true };
}

export async function removeListingAction(listingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const listing = await prisma.bikeListing.findUnique({ where: { id: listingId } });
  if (!listing) return { ok: false, error: "Listing not found." };
  if (listing.sellerId !== user.id && user.role !== "ADMIN") return { ok: false, error: "Not authorized." };
  await prisma.bikeListing.update({ where: { id: listingId }, data: { status: "REMOVED" } });
  revalidatePath(`/bike/${listingId}`);
  revalidatePath("/account/listings");
  revalidatePath("/browse");
  return { ok: true };
}

export interface UpdateListingDetailsInput {
  groupset?: string;
  brakeType?: string;
  suspension?: string;
  wheelset?: string;
  wheelsUpgraded?: boolean;
  wheelSize?: string;
  condition: Condition;
  mileageLevel?: MileageLevel;
  description: string;
  upgrades?: string;
  askingPrice: number;
  originalMsrp?: number;
  status: "ACTIVE" | "SOLD";
}

/** Powers the seller-facing Edit Listing page — components, price, and sold status, in one save. */
export async function updateListingDetailsAction(listingId: string, input: UpdateListingDetailsInput): Promise<ActionResult> {
  const user = await requireUser();
  const listing = await prisma.bikeListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return { ok: false, error: "Not authorized." };
  if (listing.status === "REMOVED") return { ok: false, error: "This listing has been removed and can no longer be edited." };

  const askingPriceCents = dollarsInputToCents(input.askingPrice);
  const originalMsrpCents = input.originalMsrp ? dollarsInputToCents(input.originalMsrp) : null;

  const updated = await prisma.bikeListing.update({
    where: { id: listingId },
    data: {
      groupset: input.groupset || null,
      brakeType: input.brakeType || null,
      suspension: input.suspension || null,
      wheelset: input.wheelset || null,
      wheelsUpgraded: !!input.wheelsUpgraded,
      wheelSize: input.wheelSize || null,
      condition: input.condition,
      mileageLevel: input.mileageLevel || null,
      description: input.description,
      upgrades: input.upgrades || null,
      askingPrice: askingPriceCents,
      originalMsrp: originalMsrpCents,
      status: input.status,
      soldAt: input.status === "SOLD" ? (listing.soldAt ?? new Date()) : null,
    },
  });

  const engine = getValuationEngine();
  const result = await engine.estimate({
    category: updated.category as ValuationInput["category"],
    brand: updated.brand,
    model: updated.model,
    year: updated.year,
    frameMaterial: updated.frameMaterial as ValuationInput["frameMaterial"],
    groupset: updated.groupset,
    wheelset: updated.wheelset,
    wheelsUpgraded: updated.wheelsUpgraded,
    condition: updated.condition as ValuationInput["condition"],
    mileageLevel: updated.mileageLevel as ValuationInput["mileageLevel"],
    originalMsrpCents: updated.originalMsrp,
    state: updated.state,
    askingPriceCents,
  });

  await prisma.bikeValuation.updateMany({ where: { listingId }, data: { isCurrent: false } });
  await prisma.bikeValuation.create({
    data: {
      listingId,
      estimatedLow: result.estimatedLowCents,
      estimatedMid: result.estimatedMidCents,
      estimatedHigh: result.estimatedHighCents,
      askingPriceSnapshot: result.askingPriceCents,
      pricePositionPct: result.pricePositionPct,
      pricePositionLabel: result.pricePositionLabel,
      breakdown: JSON.stringify(result.breakdown),
      engineVersion: result.engineVersion,
    },
  });

  revalidatePath(`/bike/${listingId}`);
  revalidatePath("/account/listings");
  revalidatePath("/browse");
  return { ok: true };
}

export async function incrementViewCountAction(listingId: string) {
  await prisma.bikeListing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}
