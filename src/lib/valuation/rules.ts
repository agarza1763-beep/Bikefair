import type { BikeCategory } from "@/lib/constants";

/**
 * Default numeric knobs for the rules-based valuation engine, seeded into the `ValuationRule`
 * table (see prisma/seed.ts) so admins can tune them from /admin/valuation-rules without a
 * deploy. This file only supplies the *fallback/default* values and the lookup tables that are
 * too structural to be single numeric knobs (brand tiers, groupset tiers, category base prices).
 */

// ---- Category base price when no MSRP is known (cents), for a "mid-tier" NEW bike in GOOD condition ----
export const CATEGORY_BASE_PRICE_CENTS: Record<BikeCategory, number> = {
  ROAD: 180000,
  MOUNTAIN: 190000,
  GRAVEL: 210000,
  HYBRID: 90000,
  COMMUTER: 80000,
  BMX: 55000,
  CRUISER: 60000,
  EBIKE: 220000,
  KIDS: 35000,
  FOLDING: 90000,
  TOURING: 175000,
  TRIATHLON: 250000,
  OTHER: 100000,
};

// ---- Brand tiers affect the base-price multiplier when MSRP is unknown ----
const PREMIUM_BRANDS = ["trek", "specialized", "cannondale", "santa cruz", "cervelo", "cervélo", "pinarello", "canyon", "yeti", "bianchi", "orbea"];
const VALUE_BRANDS = ["schwinn", "mongoose", "huffy", "kent", "magna"];

export function brandTierMultiplier(brand: string): number {
  const b = brand.trim().toLowerCase();
  if (PREMIUM_BRANDS.some((p) => b.includes(p))) return 1.15;
  if (VALUE_BRANDS.some((p) => b.includes(p))) return 0.75;
  return 1.0;
}

// ---- Groupset tiers: flat dollar adjustment (cents) relative to a "mid" groupset baseline ----
// Matched by substring against the free-text groupset field the seller enters.
type GroupsetTier = { keywords: string[]; adjustmentCents: number; label: string };

export const GROUPSET_TIERS: GroupsetTier[] = [
  { keywords: ["dura-ace", "dura ace", "xtr", "red etap", "sram red", "xx1", "xx sl"], adjustmentCents: 60000, label: "Top-tier groupset" },
  { keywords: ["ultegra", "xt", "force", "x01", "gx eagle transmission"], adjustmentCents: 30000, label: "High-tier groupset" },
  { keywords: ["105", "slx", "rival", "gx", "deore xt"], adjustmentCents: 12000, label: "Mid-high groupset" },
  { keywords: ["tiagra", "deore", "apex", "nx"], adjustmentCents: 0, label: "Mid-tier groupset" },
  { keywords: ["sora", "alivio", "acera", "claris", "altus"], adjustmentCents: -8000, label: "Entry-tier groupset" },
];

export function groupsetAdjustmentCents(groupset?: string | null): { amountCents: number; label: string } | null {
  if (!groupset) return null;
  const g = groupset.trim().toLowerCase();
  for (const tier of GROUPSET_TIERS) {
    if (tier.keywords.some((k) => g.includes(k))) {
      return { amountCents: tier.adjustmentCents, label: tier.label };
    }
  }
  return null;
}

// ---- Default rule values (used to seed ValuationRule + as fallback if a rule is missing/inactive) ----
export const DEFAULT_RULES = {
  "depreciation.year.0": 1.0,
  "depreciation.year.1": 0.85,
  "depreciation.year.2": 0.73,
  "depreciation.year.3": 0.63,
  "depreciation.year.4": 0.55,
  "depreciation.year.5": 0.48,
  "depreciation.year.7": 0.38,
  "depreciation.year.10": 0.28,
  "material.CARBON": 1.15,
  "material.TITANIUM": 1.2,
  "material.ALUMINUM": 1.0,
  "material.STEEL": 0.95,
  "material.CHROMOLY": 0.97,
  "material.OTHER": 1.0,
  "condition.NEW": 0.05,
  "condition.EXCELLENT": 0.0,
  "condition.GOOD": -0.08,
  "condition.FAIR": -0.18,
  "condition.POOR": -0.35,
  "wear.UNDER_100": 0.0,
  "wear.UNDER_500": -0.01,
  "wear.UNDER_1000": -0.03,
  "wear.UNDER_5000": -0.06,
  "wear.OVER_5000": -0.1,
  "wear.UNKNOWN": -0.03,
  "wheel_upgrade.flat_cents": 20000,
  "market.default_multiplier": 1.0,
  "range.default_pct": 0.07,
  "fair_price.tolerance_pct": 0.03,
  "fair_price.slight_tolerance_pct": 0.15,
} as const;

export type DefaultRuleKey = keyof typeof DEFAULT_RULES;
