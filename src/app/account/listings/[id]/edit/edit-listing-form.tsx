"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateListingDetailsAction } from "@/server/actions/listings";
import { CONDITIONS, CONDITION_LABELS, CONDITION_DESCRIPTIONS, MILEAGE_LEVELS, MILEAGE_LABELS, type Condition, type MileageLevel } from "@/lib/constants";

interface FormState {
  groupset: string;
  brakeType: string;
  suspension: string;
  wheelset: string;
  wheelsUpgraded: boolean;
  wheelSize: string;
  condition: Condition;
  mileageLevel: MileageLevel | "";
  description: string;
  upgrades: string;
  askingPrice: string;
  originalMsrp: string;
  status: "ACTIVE" | "SOLD";
}

export function EditListingForm({ listingId, initial }: { listingId: string; initial: FormState }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await updateListingDetailsAction(listingId, {
      groupset: form.groupset,
      brakeType: form.brakeType,
      suspension: form.suspension,
      wheelset: form.wheelset,
      wheelsUpgraded: form.wheelsUpgraded,
      wheelSize: form.wheelSize,
      condition: form.condition,
      mileageLevel: form.mileageLevel || undefined,
      description: form.description,
      upgrades: form.upgrades,
      askingPrice: Number(form.askingPrice),
      originalMsrp: form.originalMsrp ? Number(form.originalMsrp) : undefined,
      status: form.status,
    });
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(res.error);
    }
    setSaving(false);
  }

  return (
    <div className="card space-y-5 p-6">
      <div>
        <p className="label">Status</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => set("status", "ACTIVE")}
            className={`rounded-lg border p-3 text-sm font-semibold ${form.status === "ACTIVE" ? "border-green-600 bg-green-50 text-green-800" : "border-charcoal-100 text-charcoal-700 hover:border-charcoal-300"}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => set("status", "SOLD")}
            className={`rounded-lg border p-3 text-sm font-semibold ${form.status === "SOLD" ? "border-green-600 bg-green-50 text-green-800" : "border-charcoal-100 text-charcoal-700 hover:border-charcoal-300"}`}
          >
            Sold
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Asking price ($)" value={form.askingPrice} onChange={(v) => set("askingPrice", v)} type="number" />
        <TextField label="Original MSRP, if known ($)" value={form.originalMsrp} onChange={(v) => set("originalMsrp", v)} type="number" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Groupset" value={form.groupset} onChange={(v) => set("groupset", v)} placeholder="Shimano 105, SRAM Rival…" />
        <TextField label="Wheelset" value={form.wheelset} onChange={(v) => set("wheelset", v)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Brake type" value={form.brakeType} onChange={(v) => set("brakeType", v)} />
        <TextField label="Suspension" value={form.suspension} onChange={(v) => set("suspension", v)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Wheel size" value={form.wheelSize} onChange={(v) => set("wheelSize", v)} placeholder="700c, 29in…" />
        <SelectField label="Mileage / use" value={form.mileageLevel} onChange={(v) => set("mileageLevel", v as MileageLevel)} options={MILEAGE_LEVELS.map((m) => [m, MILEAGE_LABELS[m]])} />
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

      <div>
        <label className="label">Description</label>
        <textarea className="textarea" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div>
        <label className="label">Upgrades</label>
        <textarea className="textarea" rows={2} value={form.upgrades} onChange={(e) => set("upgrades", e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved — the fair value estimate has been recalculated.</p>}

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save Changes"}
      </Button>
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
