// Shared vocabulary for the app. Prisma models store these as plain strings (see prisma/schema.prisma
// header note on why enums aren't used at the DB layer) — these arrays + types are the single source
// of truth for validation (zod), filters, and display labels.

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "BikeFair";

export const BIKE_CATEGORIES = [
  "ROAD",
  "MOUNTAIN",
  "GRAVEL",
  "HYBRID",
  "COMMUTER",
  "BMX",
  "CRUISER",
  "EBIKE",
  "KIDS",
  "FOLDING",
  "TOURING",
  "TRIATHLON",
  "OTHER",
] as const;
export type BikeCategory = (typeof BIKE_CATEGORIES)[number];

export const BIKE_CATEGORY_LABELS: Record<BikeCategory, string> = {
  ROAD: "Road",
  MOUNTAIN: "Mountain",
  GRAVEL: "Gravel",
  HYBRID: "Hybrid",
  COMMUTER: "Commuter",
  BMX: "BMX",
  CRUISER: "Cruiser",
  EBIKE: "E-Bike",
  KIDS: "Kids",
  FOLDING: "Folding",
  TOURING: "Touring",
  TRIATHLON: "Triathlon / Time Trial",
  OTHER: "Other",
};

export const FRAME_MATERIALS = ["CARBON", "ALUMINUM", "STEEL", "TITANIUM", "CHROMOLY", "OTHER"] as const;
export type FrameMaterial = (typeof FRAME_MATERIALS)[number];
export const FRAME_MATERIAL_LABELS: Record<FrameMaterial, string> = {
  CARBON: "Carbon Fiber",
  ALUMINUM: "Aluminum",
  STEEL: "Steel",
  TITANIUM: "Titanium",
  CHROMOLY: "Chromoly",
  OTHER: "Other",
};

export const CONDITIONS = ["NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
export type Condition = (typeof CONDITIONS)[number];
export const CONDITION_LABELS: Record<Condition, string> = {
  NEW: "New / Never Ridden",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor / Needs Work",
};
export const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  NEW: "Unused or ridden only a handful of times. No visible wear.",
  EXCELLENT: "Lightly used, well maintained, minimal cosmetic wear.",
  GOOD: "Normal wear from regular riding. Fully functional, no needed repairs.",
  FAIR: "Noticeable wear and/or a minor repair is needed soon.",
  POOR: "Heavy wear, deferred maintenance, or needs significant repair.",
};

export const MILEAGE_LEVELS = ["UNDER_100", "UNDER_500", "UNDER_1000", "UNDER_5000", "OVER_5000", "UNKNOWN"] as const;
export type MileageLevel = (typeof MILEAGE_LEVELS)[number];
export const MILEAGE_LABELS: Record<MileageLevel, string> = {
  UNDER_100: "Under 100 miles",
  UNDER_500: "100–500 miles",
  UNDER_1000: "500–1,000 miles",
  UNDER_5000: "1,000–5,000 miles",
  OVER_5000: "5,000+ miles",
  UNKNOWN: "Not sure / not tracked",
};

export const LISTING_STATUSES = ["DRAFT", "ACTIVE", "PENDING", "SOLD", "REMOVED"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const SERIAL_STATUSES = [
  "NOT_SUBMITTED",
  "NOT_VERIFIED",
  "PENDING_REVIEW",
  "VERIFIED",
  "POTENTIAL_ISSUE",
  "REVIEW_REQUIRED",
] as const;
export type SerialStatus = (typeof SERIAL_STATUSES)[number];
export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
  NOT_SUBMITTED: "Not submitted",
  NOT_VERIFIED: "Not verified",
  PENDING_REVIEW: "Pending review",
  VERIFIED: "Verified",
  POTENTIAL_ISSUE: "Potential issue",
  REVIEW_REQUIRED: "Review required",
};

export const VERIFICATION_LEVELS = ["BASIC", "VERIFIED", "TRUSTED"] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export const MEETUP_TYPES = ["PUBLIC", "BIKE_SHOP", "LAW_ENFORCEMENT"] as const;
export type MeetupType = (typeof MEETUP_TYPES)[number];
export const MEETUP_TYPE_LABELS: Record<MeetupType, string> = {
  PUBLIC: "Public Meetup",
  BIKE_SHOP: "Participating Bike Shop",
  LAW_ENFORCEMENT: "Law-Enforcement-Supported Location",
};

export const MEETUP_STATUSES = ["PROPOSED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type MeetupStatus = (typeof MEETUP_STATUSES)[number];

export const OFFER_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const TRANSACTION_STATUSES = ["PENDING", "BUYER_CONFIRMED", "SELLER_CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const REPORT_TYPES = [
  "STOLEN_SUSPECTED",
  "FRAUD",
  "FAKE_LISTING",
  "MISREPRESENTATION",
  "UNSAFE_BEHAVIOR",
  "HARASSMENT",
  "NO_SHOW",
  "OTHER",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  STOLEN_SUSPECTED: "Suspected stolen bicycle",
  FRAUD: "Fraud",
  FAKE_LISTING: "Fake listing",
  MISREPRESENTATION: "Misrepresentation",
  UNSAFE_BEHAVIOR: "Unsafe behavior",
  HARASSMENT: "Harassment",
  NO_SHOW: "No-show",
  OTHER: "Other",
};

export const REPORT_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const FEE_TYPES = ["LISTING", "FEATURED_LISTING", "PREMIUM_LISTING", "SELLER_CLOSING", "VALUATION_REPORT", "BIKE_SHOP_MEMBERSHIP", "BIKE_SHOP_MEMBERSHIP_YEARLY"] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const BIKE_SHOP_MEMBERSHIP_STATUSES = ["NONE", "PENDING", "ACTIVE", "CANCELLED"] as const;
export type BikeShopMembershipStatus = (typeof BIKE_SHOP_MEMBERSHIP_STATUSES)[number];

export const PRICE_POSITION_LABELS = {
  FAIR: "Fair Price",
  SLIGHTLY_ABOVE: "Slightly Above Fair Value",
  SLIGHTLY_BELOW: "Slightly Below Fair Value",
  SIGNIFICANTLY_ABOVE: "Significantly Above Fair Value",
  SIGNIFICANTLY_BELOW: "Significantly Below Fair Value",
} as const;
export type PricePositionLabel = keyof typeof PRICE_POSITION_LABELS;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function centsToDollarsInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toString();
}

export function dollarsInputToCents(value: string | number): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
