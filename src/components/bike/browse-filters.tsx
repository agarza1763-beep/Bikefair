"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { BIKE_CATEGORIES, BIKE_CATEGORY_LABELS, CONDITIONS, CONDITION_LABELS, FRAME_MATERIALS, FRAME_MATERIAL_LABELS, US_STATES } from "@/lib/constants";

export function BrowseFiltersPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState<Record<string, string | undefined>>(() => Object.fromEntries(searchParams.entries()));

  function apply(next: Record<string, string | undefined>) {
    const merged = { ...local, ...next };
    setLocal(merged);
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    startTransition(() => router.push(`/browse?${params.toString()}`));
  }

  function clearAll() {
    setLocal({});
    startTransition(() => router.push("/browse"));
  }

  return (
    <div className="space-y-6 rounded-2xl border border-charcoal-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-charcoal-900">Filters</h3>
        <button onClick={clearAll} className="text-xs font-medium text-charcoal-500 hover:text-green-700">
          Clear all
        </button>
      </div>

      <Field label="Bike type">
        <select className="input" value={local.category ?? ""} onChange={(e) => apply({ category: e.target.value || undefined })}>
          <option value="">All types</option>
          {BIKE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {BIKE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Brand">
        <input className="input" placeholder="e.g. Trek" value={local.brand ?? ""} onChange={(e) => apply({ brand: e.target.value || undefined })} />
      </Field>

      <Field label="Price range">
        <div className="flex gap-2">
          <input className="input" type="number" placeholder="Min" value={local.minPrice ?? ""} onChange={(e) => apply({ minPrice: e.target.value || undefined })} />
          <input className="input" type="number" placeholder="Max" value={local.maxPrice ?? ""} onChange={(e) => apply({ maxPrice: e.target.value || undefined })} />
        </div>
      </Field>

      <Field label="Condition">
        <select className="input" value={local.condition ?? ""} onChange={(e) => apply({ condition: e.target.value || undefined })}>
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {CONDITION_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Frame material">
        <select className="input" value={local.frameMaterial ?? ""} onChange={(e) => apply({ frameMaterial: e.target.value || undefined })}>
          <option value="">Any material</option>
          {FRAME_MATERIALS.map((m) => (
            <option key={m} value={m}>
              {FRAME_MATERIAL_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="State">
        <select className="input" value={local.state ?? ""} onChange={(e) => apply({ state: e.target.value || undefined })}>
          <option value="">Any state</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Minimum year">
        <input className="input" type="number" placeholder="e.g. 2018" value={local.minYear ?? ""} onChange={(e) => apply({ minYear: e.target.value || undefined })} />
      </Field>

      <div className="space-y-2 border-t border-charcoal-100 pt-4">
        <Checkbox label="E-bikes only" checked={local.ebikeOnly === "1"} onChange={(v) => apply({ ebikeOnly: v ? "1" : undefined })} />
        <Checkbox label="Verified sellers only" checked={local.verifiedOnly === "1"} onChange={(v) => apply({ verifiedOnly: v ? "1" : undefined })} />
        <Checkbox label="Recognized brands only" checked={local.recognizedBrandOnly === "1"} onChange={(v) => apply({ recognizedBrandOnly: v ? "1" : undefined })} />
      </div>

      <div className="space-y-2 border-t border-charcoal-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">Fair value</p>
        <Checkbox label="🟢 Fair price only" checked={local.fairPriceOnly === "1"} onChange={(v) => apply({ fairPriceOnly: v ? "1" : undefined, belowFairValue: undefined, aboveFairValue: undefined })} />
        <Checkbox label="Priced below fair value" checked={local.belowFairValue === "1"} onChange={(v) => apply({ belowFairValue: v ? "1" : undefined, fairPriceOnly: undefined })} />
        <Checkbox label="Priced above fair value" checked={local.aboveFairValue === "1"} onChange={(v) => apply({ aboveFairValue: v ? "1" : undefined, fairPriceOnly: undefined })} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-charcoal-400">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-charcoal-700">
      <input type="checkbox" className="h-4 w-4 rounded border-charcoal-300 text-green-700 focus:ring-green-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
