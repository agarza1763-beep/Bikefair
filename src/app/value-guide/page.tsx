import { LinkButton } from "@/components/ui/button";
import { ValuationBreakdown } from "@/components/bike/valuation-breakdown";

export const metadata = {
  title: "Fair Value Guide",
  description: "How BikeFair estimates a used bicycle's fair market value — brand, model year, groupset, condition, mileage, and more.",
};

const FACTORS = [
  "Brand & model",
  "Model year",
  "Bicycle category",
  "Original MSRP (when known)",
  "Frame material",
  "Groupset",
  "Components & upgrades",
  "Wheelset",
  "Condition",
  "Wear / mileage",
  "Frame size",
  "Geographic market",
  "Age / depreciation",
];

const exampleBreakdown = [
  { label: "Base bicycle value", amountCents: 185000 },
  { label: "Condition adjustment", amountCents: 15000, note: "excellent" },
  { label: "Wheel upgrade", amountCents: 20000 },
  { label: "Wear adjustment", amountCents: -10000 },
  { label: "Local market adjustment", amountCents: 5000 },
  { label: "Estimated value", amountCents: 215000 },
];

export default function ValueGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">The Fair Value Guide</h1>
      <p className="mt-3 max-w-2xl text-charcoal-600">
        Every listing on BikeFair shows an <strong>Estimated Fair Market Value</strong> — a price range, not a guarantee — calculated from the bicycle's own
        specifications and condition. It's meant to help buyers and sellers agree on a fair price faster, not to replace your own judgment or a bike shop's appraisal.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal-900">What goes into the estimate</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {FACTORS.map((f) => (
              <li key={f} className="rounded-lg bg-charcoal-50 px-3 py-2 text-sm text-charcoal-700">
                {f}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-xl font-bold text-charcoal-900">How we classify pricing</h2>
          <ul className="mt-4 space-y-2 text-sm text-charcoal-700">
            <li>🟢 <strong>Fair</strong> — asking price is within our estimated range.</li>
            <li>🟡 <strong>Slightly above/below</strong> — asking price is close to, but outside, the estimated range.</li>
            <li>🔴 <strong>Significantly above/below</strong> — asking price is well outside the estimated range.</li>
          </ul>

          <p className="mt-8 rounded-xl bg-amber-100 p-4 text-sm text-charcoal-800">
            <strong>This is an estimate, not an appraisal.</strong> It's produced by a configurable, rules-based engine using bicycle specifications and general market
            patterns — not a certified appraiser, and not (yet) live sold-comp data. Always inspect a bike in person before buying.
          </p>
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-bold text-charcoal-900">Example breakdown</h2>
          <ValuationBreakdown breakdown={exampleBreakdown} estimatedLowCents={200000} estimatedHighCents={230000} askingPriceCents={230000} pricePositionPct={5} pricePositionLabel="SLIGHTLY_ABOVE" />
        </div>
      </div>

      <div className="mt-12 text-center">
        <LinkButton href="/check-value" variant="accent" size="lg">
          Check Your Bike's Value
        </LinkButton>
      </div>
    </div>
  );
}
