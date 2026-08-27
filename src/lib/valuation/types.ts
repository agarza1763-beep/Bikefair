import type { BikeCategory, Condition, FrameMaterial, MileageLevel, PricePositionLabel } from "@/lib/constants";

/** Everything the valuation engine needs to know about a bike to price it. */
export interface ValuationInput {
  category: BikeCategory;
  brand: string;
  model: string;
  year: number;
  frameMaterial: FrameMaterial;
  groupset?: string | null;
  wheelset?: string | null;
  wheelsUpgraded?: boolean;
  condition: Condition;
  mileageLevel?: MileageLevel | null;
  originalMsrpCents?: number | null;
  upgrades?: string | null;
  state?: string | null;
  askingPriceCents: number;
}

export interface ValuationBreakdownLine {
  label: string;
  amountCents: number;
  note?: string;
}

export interface ValuationResult {
  estimatedLowCents: number;
  estimatedMidCents: number;
  estimatedHighCents: number;
  askingPriceCents: number;
  pricePositionPct: number;
  pricePositionLabel: PricePositionLabel;
  breakdown: ValuationBreakdownLine[];
  engineVersion: string;
}

/**
 * Contract every valuation engine must satisfy. The MVP ships `RulesBasedValuationEngine`
 * (see engine.ts) — a transparent, admin-configurable rules engine. A future engine (e.g.
 * `MarketCompsValuationEngine` backed by real sold-comp data, or `MLValuationEngine`) can
 * implement the same interface and be swapped in via `getValuationEngine()` without touching
 * any calling code (sell wizard, listing pages, admin tools).
 */
export interface IValuationEngine {
  readonly version: string;
  estimate(input: ValuationInput): Promise<ValuationResult>;
}
