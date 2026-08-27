"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { listingWizardSchema, type ListingWizardInput } from "@/lib/validation";
import { getValuationEngine } from "@/lib/valuation/engine";
import type { ValuationInput } from "@/lib/valuation/types";
import { getStorageProvider, validateImageUpload } from "@/lib/storage";
import { geocode } from "@/lib/geo";
import { dollarsInputToCents } from "@/lib/constants";
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

export async function uploadImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireUser();
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "No file provided." };

    validateImageUpload({ size: file.size, mimeType: file.type });
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await getStorageProvider().save({ buffer, filename: file.name, mimeType: file.type });
    return { ok: true, data: { url } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function createListingAction(input: ListingWizardInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = listingWizardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid listing data." };
  const data = parsed.data;

  const point = await geocode(data.city, data.state);
  const askingPriceCents = dollarsInputToCents(data.askingPrice);
  const originalMsrpCents = data.originalMsrp ? dollarsInputToCents(data.originalMsrp) : null;

  const listing = await prisma.bikeListing.create({
    data: {
      sellerId: user.id,
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

export async function updateAskingPriceAction(listingId: string, askingPrice: number): Promise<ActionResult> {
  const user = await requireUser();
  const listing = await prisma.bikeListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return { ok: false, error: "Not authorized." };

  const askingPriceCents = dollarsInputToCents(askingPrice);
  await prisma.bikeListing.update({ where: { id: listingId }, data: { askingPrice: askingPriceCents } });

  const engine = getValuationEngine();
  const result = await engine.estimate({
    category: listing.category as ValuationInput["category"],
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    frameMaterial: listing.frameMaterial as ValuationInput["frameMaterial"],
    groupset: listing.groupset,
    wheelset: listing.wheelset,
    wheelsUpgraded: listing.wheelsUpgraded,
    condition: listing.condition as ValuationInput["condition"],
    mileageLevel: listing.mileageLevel as ValuationInput["mileageLevel"],
    originalMsrpCents: listing.originalMsrp,
    state: listing.state,
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
  return { ok: true };
}

export async function incrementViewCountAction(listingId: string) {
  await prisma.bikeListing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}
