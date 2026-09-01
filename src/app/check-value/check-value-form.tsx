"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ValuationBreakdown } from "@/components/bike/valuation-breakdown";
import { previewStandaloneValuationAction } from "@/server/actions/listings";
import type { ValuationResult } from "@/lib/valuation/types";
import {
  BIKE_CATEGORIES,
  BIKE_CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  CONDITION_DESCRIPTIONS,
  FRAME_MATERIALS,
  FRAME_MATERIAL_LABELS,
  MILEAGE_LEVELS,
  MILEAGE_LABELS,
  US_STATES,
  type BikeCategory,
  type Condition,
  type FrameMaterial,
  type MileageLevel,
} from "@/lib/constants";

interface FormState {
  category: BikeCategory | "";
  brand: string;
  model: string;
  year: string;
  frameMaterial: FrameMaterial | "";
  groupset: string;
  wheelset: string;
  wheelsUpgraded: boolean;
  condition: Condition | "";
  mileageLevel: MileageLevel | "";
  originalMsrp: string;
  state: string;
}

const initialState: FormState = {
  category: "",
  brand: "",
  model: "",
  year: String(new Date().getFullYear()),
  frameMaterial: "",
  groupset: "",
  wheelset: "",
  wheelsUpgraded: false,
  condition: "",
  mileageLevel: "",
  originalMsrp: "",
  state: "",
};

function canSubmit(form: FormState): boolean {
  return !!(form.category && form.brand && form.year && form.frameMaterial && form.condition);
}

export function CheckValueForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setValuation(null);
  }

  async function calculate() {
    if (!canSubmit(form)) return;
    setLoading(true);
    setError(null);
    const res = await previewStandaloneValuationAction({
      category: form.category as BikeCategory,
      brand: form.brand,
      model: form.model,
      year: Number(form.year),
      frameMaterial: form.frameMaterial as FrameMaterial,
      groupset: form.groupset,
      wheelset: form.wheelset,
      wheelsUpgraded: form.wheelsUpgraded,
      condition: form.condition as Condition,
      mileageLevel: (form.mileageLevel || undefined) as MileageLevel | undefined,
      originalMsrp: form.originalMsrp || undefined,
      state: (form.state || undefined) as (typeof US_STATES)[number] | undefined,
    });
    if (res.ok) setValuation(res.data);
    else setError("Something went wrong calculating your estimate. Please try again.");
    setLoading(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <SelectField label="Bike type" value={form.category} onChange={(v) => set("category", v as BikeCategory)} options={BIKE_CATEGORIES.map((c) => [c, BIKE_CATEGORY_LABELS[c]])} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Brand" value={form.brand} onChange={(v) => set("brand", v)} placeholder="Trek, Specialized, Cannondale…" />
          <TextField label="Model (optional)" value={form.model} onChange={(v) => set("model", v)} placeholder="Checkpoint SL 5" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Year" value={form.year} onChange={(v) => set("year", v)} type="number" />
          <SelectField label="Frame material" value={form.frameMaterial} onChange={(v) => set("frameMaterial", v as FrameMaterial)} options={FRAME_MATERIALS.map((m) => [m, FRAME_MATERIAL_LABELS[m]])} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Groupset (optional)" value={form.groupset} onChange={(v) => set("groupset", v)} placeholder="Shimano 105, SRAM Rival…" />
          <TextField label="Wheelset (optional)" value={form.wheelset} onChange={(v) => set("wheelset", v)} />
        </div>

        <label className="flex items-center gap-2 text-sm text-charcoal-700">
          <input type="checkbox" checked={form.wheelsUpgraded} onChange={(e) => set("wheelsUpgraded", e.target.checked)} className="h-4 w-4 rounded border-charcoal-300" />
          Wheels have been upgraded from stock
        </label>

        <div>
          <p className="label">Condition</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("condition", c)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  form.condition === c ? "border-green-600 bg-green-50" : "border-charcoal-100 hover:border-charcoal-300"
                }`}
              >
                <p className="text-sm font-semibold text-charcoal-900">{CONDITION_LABELS[c]}</p>
                <p className="text-xs text-charcoal-500">{CONDITION_DESCRIPTIONS[c]}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Mileage / use (optional)" value={form.mileageLevel} onChange={(v) => set("mileageLevel", v as MileageLevel)} options={MILEAGE_LEVELS.map((m) => [m, MILEAGE_LABELS[m]])} />
          <TextField label="Original MSRP, if known (optional)" value={form.originalMsrp} onChange={(v) => set("originalMsrp", v)} type="number" placeholder="$" />
        </div>

        <SelectField label="State (optional, refines local market)" value={form.state} onChange={(v) => set("state", v)} options={US_STATES.map((s) => [s, s])} />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={calculate} disabled={!canSubmit(form) || loading} className="w-full">
          {loading ? "Calculating…" : "Calculate Fair Value"}
        </Button>
      </div>

      <div>
        {valuation ? (
          <ValuationBreakdown breakdown={valuation.breakdown} estimatedLowCents={valuation.estimatedLowCents} estimatedHighCents={valuation.estimatedHighCents} showAsking={false} />
        ) : (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal-200 p-8 text-center">
            <p className="text-sm text-charcoal-500">Fill in the bike's details and click Calculate to see its estimated fair value here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
