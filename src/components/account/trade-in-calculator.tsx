"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ValuationBreakdown } from "@/components/bike/valuation-breakdown";
import { previewStandaloneValuationAction } from "@/server/actions/listings";
import { formatCents } from "@/lib/constants";
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
};

// A commonly-cited starting range for used-gear trade-ins (the shop needs margin for refurb,
// resale risk, and time-on-shelf) — a starting point for the shop's own offer, not a rule.
const TRADE_IN_LOW_PCT = 0.4;
const TRADE_IN_HIGH_PCT = 0.55;

function canSubmit(form: FormState): boolean {
  return !!(form.category && form.brand && form.year && form.frameMaterial && form.condition);
}

export function TradeInCalculator({ shopState }: { shopState: string }) {
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
      state: shopState as never,
    });
    if (res.ok) setValuation(res.data);
    else setError("Something went wrong calculating this estimate. Please try again.");
    setLoading(false);
  }

  const tradeInLowCents = valuation ? Math.round(valuation.estimatedMidCents * TRADE_IN_LOW_PCT) : 0;
  const tradeInHighCents = valuation ? Math.round(valuation.estimatedMidCents * TRADE_IN_HIGH_PCT) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={calculate} disabled={!canSubmit(form) || loading} className="w-full">
          {loading ? "Calculating…" : "Calculate Trade-In Value"}
        </Button>
      </div>

      <div className="space-y-4">
        {valuation ? (
          <>
            <div className="rounded-2xl border-2 border-green-600 bg-green-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Suggested Trade-In Offer</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-green-900">
                {formatCents(tradeInLowCents)} – {formatCents(tradeInHighCents)}
              </p>
              <p className="mt-1 text-xs text-green-800">
                {Math.round(TRADE_IN_LOW_PCT * 100)}–{Math.round(TRADE_IN_HIGH_PCT * 100)}% of estimated fair market value — a starting point that leaves you room for
                refurbishment, resale time, and margin. Adjust for your own costs and this bike's actual condition in hand.
              </p>
            </div>
            <ValuationBreakdown breakdown={valuation.breakdown} estimatedLowCents={valuation.estimatedLowCents} estimatedHighCents={valuation.estimatedHighCents} showAsking={false} />
            <div className="rounded-xl bg-charcoal-50 p-4 text-sm text-charcoal-600">
              <p>Taking this bike in trade? List it as used inventory and it'll show a fair-value badge to buyers just like any other used listing.</p>
              <Link href="/sell/create" className="mt-2 inline-block font-medium text-green-700 hover:underline">
                Start a listing →
              </Link>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal-200 p-8 text-center">
            <p className="text-sm text-charcoal-500">Fill in the bike's details and click Calculate to see a suggested trade-in offer here.</p>
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
