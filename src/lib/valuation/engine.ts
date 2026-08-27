import { prisma } from "@/lib/prisma";
import type { PricePositionLabel } from "@/lib/constants";
import { CATEGORY_BASE_PRICE_CENTS, DEFAULT_RULES, brandTierMultiplier, groupsetAdjustmentCents, type DefaultRuleKey } from "./rules";
import type { IValuationEngine, ValuationBreakdownLine, ValuationInput, ValuationResult } from "./types";

/**
 * Loads active numeric rules from the ValuationRule table (admin-editable via /admin/valuation-rules),
 * falling back to the code defaults in rules.ts for any key that's missing or deactivated. This is
 * what makes the engine "configurable" without a redeploy.
 */
async function loadRuleMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>(Object.entries(DEFAULT_RULES) as [string, number][]);
  try {
    const rows = await prisma.valuationRule.findMany({ where: { isActive: true } });
    for (const row of rows) map.set(row.key, row.value);
  } catch {
    // DB not reachable / table empty (e.g. first boot before seed) — defaults are fine.
  }
  return map;
}

function rule(map: Map<string, number>, key: DefaultRuleKey | string): number {
  return map.get(key) ?? (DEFAULT_RULES as Record<string, number>)[key] ?? 0;
}

function nearestDepreciationBucket(age: number): number {
  const buckets = [0, 1, 2, 3, 4, 5, 7, 10];
  let best = buckets[0];
  for (const b of buckets) if (age >= b) best = b;
  return best;
}

function classifyPricePosition(pct: number, tolerancePct: number, slightTolerancePct: number): PricePositionLabel {
  if (Math.abs(pct) <= tolerancePct * 100) return "FAIR";
  if (pct > 0) return pct <= slightTolerancePct * 100 ? "SLIGHTLY_ABOVE" : "SIGNIFICANTLY_ABOVE";
  return pct >= -slightTolerancePct * 100 ? "SLIGHTLY_BELOW" : "SIGNIFICANTLY_BELOW";
}

export class RulesBasedValuationEngine implements IValuationEngine {
  readonly version = "rules-v1";

  async estimate(input: ValuationInput): Promise<ValuationResult> {
    const rules = await loadRuleMap();
    const breakdown: ValuationBreakdownLine[] = [];
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - input.year);

    // 1. Base bicycle value
    let base: number;
    if (input.originalMsrpCents && input.originalMsrpCents > 0) {
      const bucket = nearestDepreciationBucket(age);
      const depreciationFactor = rule(rules, `depreciation.year.${bucket}`);
      base = Math.round(input.originalMsrpCents * depreciationFactor);
      breakdown.push({
        label: "Base bicycle value",
        amountCents: base,
        note: `Based on original MSRP and ${age}-year age depreciation`,
      });
    } else {
      const categoryBase = CATEGORY_BASE_PRICE_CENTS[input.category];
      const brandMultiplier = brandTierMultiplier(input.brand);
      const bucket = nearestDepreciationBucket(age);
      const depreciationFactor = rule(rules, `depreciation.year.${bucket}`);
      base = Math.round(categoryBase * brandMultiplier * depreciationFactor);
      breakdown.push({
        label: "Base bicycle value",
        amountCents: base,
        note: `Estimated from category, brand tier, and ${age}-year age (no MSRP on file)`,
      });
    }

    let running = base;

    // 2. Frame material adjustment
    const materialMultiplier = rule(rules, `material.${input.frameMaterial}`);
    if (materialMultiplier !== 1.0) {
      const delta = Math.round(base * (materialMultiplier - 1));
      running += delta;
      breakdown.push({ label: `Frame material (${input.frameMaterial.toLowerCase()})`, amountCents: delta });
    }

    // 3. Groupset tier adjustment
    const groupsetAdj = groupsetAdjustmentCents(input.groupset);
    if (groupsetAdj && groupsetAdj.amountCents !== 0) {
      running += groupsetAdj.amountCents;
      breakdown.push({ label: groupsetAdj.label, amountCents: groupsetAdj.amountCents, note: input.groupset ?? undefined });
    }

    // 4. Wheel upgrade adjustment
    if (input.wheelsUpgraded) {
      const wheelAdj = rule(rules, "wheel_upgrade.flat_cents");
      running += wheelAdj;
      breakdown.push({ label: "Wheel upgrade", amountCents: wheelAdj, note: input.wheelset ?? undefined });
    }

    // 5. Condition adjustment
    const conditionPct = rule(rules, `condition.${input.condition}`);
    if (conditionPct !== 0) {
      const delta = Math.round(running * conditionPct);
      running += delta;
      breakdown.push({ label: "Condition adjustment", amountCents: delta, note: input.condition.toLowerCase() });
    }

    // 6. Wear adjustment (usage/mileage)
    if (input.mileageLevel) {
      const wearPct = rule(rules, `wear.${input.mileageLevel}`);
      if (wearPct !== 0) {
        const delta = Math.round(running * wearPct);
        running += delta;
        breakdown.push({ label: "Wear adjustment", amountCents: delta });
      }
    }

    // 7. Local market adjustment
    const marketKey = input.state ? `market.state.${input.state}` : "market.default_multiplier";
    const marketMultiplier = rules.has(marketKey) ? rule(rules, marketKey) : rule(rules, "market.default_multiplier");
    if (marketMultiplier !== 1.0) {
      const delta = Math.round(running * (marketMultiplier - 1));
      running += delta;
      breakdown.push({ label: "Local market adjustment", amountCents: delta, note: input.state ? `${input.state} market` : undefined });
    }

    const mid = Math.max(2500, Math.round(running));
    const rangePct = rule(rules, "range.default_pct");
    const low = Math.round(mid * (1 - rangePct));
    const high = Math.round(mid * (1 + rangePct));

    breakdown.push({ label: "Estimated value", amountCents: mid });

    const pricePositionPct = ((input.askingPriceCents - mid) / mid) * 100;
    const tolerancePct = rule(rules, "fair_price.tolerance_pct");
    const slightTolerancePct = rule(rules, "fair_price.slight_tolerance_pct");
    const pricePositionLabel = classifyPricePosition(pricePositionPct, tolerancePct, slightTolerancePct);

    return {
      estimatedLowCents: low,
      estimatedMidCents: mid,
      estimatedHighCents: high,
      askingPriceCents: input.askingPriceCents,
      pricePositionPct: Math.round(pricePositionPct * 10) / 10,
      pricePositionLabel,
      breakdown,
      engineVersion: this.version,
    };
  }
}

let engineInstance: IValuationEngine | null = null;

/** Central accessor so callers never `new` a concrete engine directly — swap implementations here. */
export function getValuationEngine(): IValuationEngine {
  if (!engineInstance) engineInstance = new RulesBasedValuationEngine();
  return engineInstance;
}
