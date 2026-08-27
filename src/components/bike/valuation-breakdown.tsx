import { formatCents } from "@/lib/constants";
import { FairPriceBadge } from "./fair-price-badge";
import type { PricePositionLabel } from "@/lib/constants";

interface BreakdownLine {
  label: string;
  amountCents: number;
  note?: string | null;
}

export function ValuationBreakdown({
  breakdown,
  estimatedLowCents,
  estimatedHighCents,
  askingPriceCents,
  pricePositionPct,
  pricePositionLabel,
  showAsking = true,
}: {
  breakdown: BreakdownLine[];
  estimatedLowCents: number;
  estimatedHighCents: number;
  askingPriceCents?: number | null;
  pricePositionPct?: number | null;
  pricePositionLabel?: PricePositionLabel | null;
  showAsking?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-6">
      <h3 className="font-display text-lg font-bold text-charcoal-900">Fair Value Breakdown</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {breakdown.map((line, i) => {
          const isTotal = line.label === "Estimated value";
          return (
            <li
              key={i}
              className={
                isTotal
                  ? "flex items-center justify-between border-t border-charcoal-100 pt-3 font-semibold text-charcoal-900"
                  : "flex items-center justify-between text-charcoal-700"
              }
            >
              <span>
                {line.label}
                {line.note ? <span className="ml-1.5 text-xs text-charcoal-400">({line.note})</span> : null}
              </span>
              <span className={line.amountCents < 0 ? "text-red-500" : isTotal ? "text-green-700" : "text-charcoal-900"}>
                {line.amountCents > 0 && !isTotal ? "+" : ""}
                {formatCents(line.amountCents)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl bg-green-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-green-800">Estimated Fair Market Value</p>
        <p className="font-display text-2xl font-bold text-green-900">
          {formatCents(estimatedLowCents)} – {formatCents(estimatedHighCents)}
        </p>
        <p className="mt-1 text-xs text-green-800/70">This is an estimate, not a guaranteed price.</p>
      </div>

      {showAsking && askingPriceCents != null && pricePositionPct != null && pricePositionLabel && (
        <div className="mt-4 flex items-center justify-between border-t border-charcoal-100 pt-4">
          <div>
            <p className="text-xs text-charcoal-400">Asking price</p>
            <p className="font-display text-lg font-bold text-charcoal-900">{formatCents(askingPriceCents)}</p>
            <p className="mt-0.5 text-xs text-charcoal-500">
              {pricePositionPct > 0 ? "+" : ""}
              {pricePositionPct}% vs. estimated fair value
            </p>
          </div>
          <FairPriceBadge label={pricePositionLabel} />
        </div>
      )}
    </div>
  );
}
