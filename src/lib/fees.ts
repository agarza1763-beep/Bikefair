import { prisma } from "@/lib/prisma";
import type { FeeType } from "@/lib/constants";

/**
 * Marketplace fee configuration — entirely separate from the bicycle's purchase price, which
 * BikeFair never touches. Fees are stored in the `Fee` table so admins can change the business
 * model (amounts, percentage vs. flat, on/off) from /admin/fees without a code change.
 */
export const FEE_DEFAULTS: Record<FeeType, { name: string; amountCents: number; isPercentage: boolean; isActive: boolean; description: string }> = {
  LISTING: { name: "Listing Fee", amountCents: 0, isPercentage: false, isActive: false, description: "Charged when a seller publishes a standard listing." },
  FEATURED_LISTING: { name: "Featured Listing Fee", amountCents: 999, isPercentage: false, isActive: true, description: "Puts a listing in the featured/homepage placements for 14 days." },
  PREMIUM_LISTING: { name: "Premium Listing Fee", amountCents: 1999, isPercentage: false, isActive: true, description: "Featured placement plus a highlighted card style and top-of-search boost." },
  SELLER_CLOSING: { name: "Seller Closing Fee", amountCents: 300, isPercentage: true, isActive: true, description: "Percentage of the agreed sale price, charged to the seller once a transaction is marked completed." },
  VALUATION_REPORT: { name: "Detailed Valuation Report", amountCents: 499, isPercentage: false, isActive: false, description: "Optional downloadable PDF valuation report with full comps detail." },
  BIKE_SHOP_MEMBERSHIP: { name: "Bike Shop Partner Membership", amountCents: 2500, isPercentage: false, isActive: true, description: "Recurring monthly fee for a bike shop to be a participating BikeFair location — brings new cyclist foot traffic and lists the shop as a trusted community meetup spot." },
};

export async function getFee(type: FeeType) {
  const fee = await prisma.fee.findUnique({ where: { type } });
  if (fee) return fee;
  const fallback = FEE_DEFAULTS[type];
  return { id: "", type, updatedAt: new Date(), ...fallback };
}

export async function getAllFees() {
  const fees = await prisma.fee.findMany();
  const byType = new Map(fees.map((f) => [f.type, f]));
  return (Object.keys(FEE_DEFAULTS) as FeeType[]).map((type) => byType.get(type) ?? { id: "", type, updatedAt: new Date(), ...FEE_DEFAULTS[type] });
}

export function computeFeeAmountCents(fee: { amountCents: number; isPercentage: boolean }, basisCents = 0): number {
  if (!fee.isPercentage) return fee.amountCents;
  // amountCents stores basis points-as-cents convention here for percentage fees (e.g. 300 = 3.00%)
  return Math.round((basisCents * fee.amountCents) / 10000);
}
