import { prisma } from "@/lib/prisma";
import { RuleRow } from "./rule-row";

export const metadata = { title: "Admin — Valuation Rules" };

export default async function AdminValuationRulesPage() {
  const rules = await prisma.valuationRule.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  const grouped = rules.reduce<Record<string, typeof rules>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Valuation Rules</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        These numeric knobs drive the rules-based Fair Value engine (see src/lib/valuation/engine.ts). Changes take effect immediately for new valuations — existing
        listings recalculate when their asking price is next updated.
      </p>

      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([category, catRules]) => (
          <div key={category} className="card p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-charcoal-500">{category.replace(/_/g, " ")}</h2>
            <div className="mt-3 divide-y divide-charcoal-50">
              {catRules.map((r) => (
                <RuleRow key={r.key} rule={{ key: r.key, label: r.label, value: r.value, valueType: r.valueType, isActive: r.isActive }} />
              ))}
            </div>
          </div>
        ))}
        {rules.length === 0 && <p className="text-charcoal-500">No rules seeded yet — run the seed script.</p>}
      </div>
    </div>
  );
}
