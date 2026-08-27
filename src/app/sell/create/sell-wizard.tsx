"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FairPriceBadge } from "@/components/bike/fair-price-badge";
import { ValuationBreakdown } from "@/components/bike/valuation-breakdown";
import { createListingAction, previewValuationAction, uploadImageAction } from "@/server/actions/listings";
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

const TOTAL_STEPS = 10;

interface WizardState {
  category: BikeCategory | "";
  brand: string;
  model: string;
  year: string;
  frameSize: string;
  color: string;
  frameMaterial: FrameMaterial | "";
  groupset: string;
  brakeType: string;
  suspension: string;
  wheelset: string;
  wheelsUpgraded: boolean;
  wheelSize: string;
  condition: Condition | "";
  mileageLevel: MileageLevel | "";
  description: string;
  upgrades: string;
  images: string[];
  serialNumber: string;
  askingPrice: string;
  originalMsrp: string;
  city: string;
  state: string;
  zip: string;
  prefersPublicMeetup: boolean;
  prefersBikeShopMeetup: boolean;
  prefersLawEnforcement: boolean;
  meetupNotes: string;
}

const initialState: WizardState = {
  category: "",
  brand: "",
  model: "",
  year: String(new Date().getFullYear()),
  frameSize: "",
  color: "",
  frameMaterial: "",
  groupset: "",
  brakeType: "",
  suspension: "",
  wheelset: "",
  wheelsUpgraded: false,
  wheelSize: "",
  condition: "",
  mileageLevel: "",
  description: "",
  upgrades: "",
  images: [],
  serialNumber: "",
  askingPrice: "",
  originalMsrp: "",
  city: "",
  state: "",
  zip: "",
  prefersPublicMeetup: true,
  prefersBikeShopMeetup: true,
  prefersLawEnforcement: false,
  meetupNotes: "",
};

export function SellWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardState>(initialState);
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  function set<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() {
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function loadValuation() {
    const res = await previewValuationAction({
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
      originalMsrp: form.originalMsrp ? Number(form.originalMsrp) : undefined,
      state: form.state as (typeof US_STATES)[number],
      askingPrice: Number(form.askingPrice),
    });
    if (res.ok) setValuation(res.data);
    else setError(res.error);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok) set("images", [...form.images, res.data!.url]);
      else setError(res.error);
    }
    setUploading(false);
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    const res = await createListingAction({
      category: form.category as BikeCategory,
      brand: form.brand,
      model: form.model,
      year: Number(form.year),
      frameSize: form.frameSize,
      color: form.color,
      frameMaterial: form.frameMaterial as FrameMaterial,
      groupset: form.groupset,
      brakeType: form.brakeType,
      suspension: form.suspension,
      wheelset: form.wheelset,
      wheelsUpgraded: form.wheelsUpgraded,
      wheelSize: form.wheelSize,
      condition: form.condition as Condition,
      mileageLevel: (form.mileageLevel || undefined) as MileageLevel | undefined,
      description: form.description,
      upgrades: form.upgrades,
      images: form.images,
      serialNumber: form.serialNumber,
      askingPrice: Number(form.askingPrice),
      originalMsrp: form.originalMsrp ? Number(form.originalMsrp) : undefined,
      city: form.city,
      state: form.state as (typeof US_STATES)[number],
      zip: form.zip,
      prefersPublicMeetup: form.prefersPublicMeetup,
      prefersBikeShopMeetup: form.prefersBikeShopMeetup,
      prefersLawEnforcement: form.prefersLawEnforcement,
      meetupNotes: form.meetupNotes,
    });
    setPublishing(false);
    if (!res.ok) return setError(res.error);
    router.push(`/bike/${res.data!.id}`);
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-charcoal-400">
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-charcoal-100">
          <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {step === 1 && (
          <StepShell title="What kind of bike is it?">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BIKE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => set("category", c)}
                  className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition-colors ${
                    form.category === c ? "border-green-600 bg-green-50 text-green-800" : "border-charcoal-100 text-charcoal-700 hover:border-charcoal-300"
                  }`}
                >
                  {BIKE_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Tell us about the bike">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Brand" value={form.brand} onChange={(v) => set("brand", v)} placeholder="Trek, Specialized, Cannondale…" />
              <TextField label="Model" value={form.model} onChange={(v) => set("model", v)} placeholder="Checkpoint SL 5" />
              <TextField label="Model year" value={form.year} onChange={(v) => set("year", v)} type="number" />
              <TextField label="Frame size" value={form.frameSize} onChange={(v) => set("frameSize", v)} placeholder='56cm or "M"' />
              <TextField label="Color" value={form.color} onChange={(v) => set("color", v)} />
              <SelectField label="Frame material" value={form.frameMaterial} onChange={(v) => set("frameMaterial", v as FrameMaterial)} options={FRAME_MATERIALS.map((m) => [m, FRAME_MATERIAL_LABELS[m]])} />
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Components">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Groupset" value={form.groupset} onChange={(v) => set("groupset", v)} placeholder="Shimano 105, SRAM Rival…" />
              <TextField label="Brake type" value={form.brakeType} onChange={(v) => set("brakeType", v)} placeholder="Hydraulic disc" />
              <TextField label="Wheelset" value={form.wheelset} onChange={(v) => set("wheelset", v)} />
              <TextField label="Wheel size" value={form.wheelSize} onChange={(v) => set("wheelSize", v)} placeholder="700c, 29in…" />
              <TextField label="Suspension (if applicable)" value={form.suspension} onChange={(v) => set("suspension", v)} />
              <label className="flex items-center gap-2 pt-6 text-sm text-charcoal-700">
                <input type="checkbox" className="h-4 w-4" checked={form.wheelsUpgraded} onChange={(e) => set("wheelsUpgraded", e.target.checked)} />
                Wheels have been upgraded from stock
              </label>
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Condition & description">
            <div className="space-y-4">
              <div>
                <label className="label">Condition</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("condition", c)}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${
                        form.condition === c ? "border-green-600 bg-green-50" : "border-charcoal-100 hover:border-charcoal-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-charcoal-900">{CONDITION_LABELS[c]}</p>
                      <p className="text-xs text-charcoal-500">{CONDITION_DESCRIPTIONS[c]}</p>
                    </button>
                  ))}
                </div>
              </div>
              <SelectField label="Mileage / use" value={form.mileageLevel} onChange={(v) => set("mileageLevel", v as MileageLevel)} options={MILEAGE_LEVELS.map((m) => [m, MILEAGE_LABELS[m]])} />
              <div>
                <label className="label">Description</label>
                <textarea className="textarea" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the bike's history, ride quality, any quirks…" />
              </div>
              <div>
                <label className="label">Upgrades (optional)</label>
                <textarea className="textarea" rows={2} value={form.upgrades} onChange={(e) => set("upgrades", e.target.value)} />
              </div>
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="Upload photos">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-charcoal-200 p-8 text-center hover:border-green-500">
              <ImagePlus className="h-8 w-8 text-charcoal-400" />
              <span className="mt-2 text-sm font-medium text-charcoal-700">{uploading ? "Uploading…" : "Click to upload photos"}</span>
              <span className="text-xs text-charcoal-400">JPEG, PNG, or WEBP — up to 8MB each</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </label>
            {form.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {form.images.map((url, i) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-charcoal-50">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 rounded-full bg-charcoal-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="Serial number">
            <p className="mb-3 text-sm text-charcoal-500">
              This helps buyers trust your listing and supports our safety review process. <strong>Never photograph or publicly post your serial number</strong> — it is
              kept internal and is not shown on your public listing.
            </p>
            <TextField label="Serial number (optional)" value={form.serialNumber} onChange={(v) => set("serialNumber", v)} placeholder="Usually stamped under the bottom bracket" />
          </StepShell>
        )}

        {step === 7 && (
          <StepShell title="Set your asking price">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Asking price ($)" value={form.askingPrice} onChange={(v) => set("askingPrice", v)} type="number" />
              <TextField label="Original MSRP, if known ($)" value={form.originalMsrp} onChange={(v) => set("originalMsrp", v)} type="number" />
            </div>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell title="Your Estimated Fair Value">
            {!valuation ? (
              <div className="flex flex-col items-center py-8">
                <Button onClick={loadValuation}>Calculate Fair Value</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <ValuationBreakdown
                  breakdown={valuation.breakdown}
                  estimatedLowCents={valuation.estimatedLowCents}
                  estimatedHighCents={valuation.estimatedHighCents}
                  askingPriceCents={valuation.askingPriceCents}
                  pricePositionPct={valuation.pricePositionPct}
                  pricePositionLabel={valuation.pricePositionLabel}
                />
                <div className="flex items-center gap-3">
                  <label className="label mb-0">Adjust asking price ($)</label>
                  <input
                    className="input max-w-[140px]"
                    type="number"
                    value={form.askingPrice}
                    onChange={(e) => set("askingPrice", e.target.value)}
                    onBlur={loadValuation}
                  />
                  <FairPriceBadge label={valuation.pricePositionLabel} />
                </div>
              </div>
            )}
          </StepShell>
        )}

        {step === 9 && (
          <StepShell title="Location & meetup preferences">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="City" value={form.city} onChange={(v) => set("city", v)} />
              <SelectField label="State" value={form.state} onChange={(v) => set("state", v)} options={US_STATES.map((s) => [s, s])} />
              <TextField label="ZIP (optional)" value={form.zip} onChange={(v) => set("zip", v)} />
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2 text-sm text-charcoal-700">
                <input type="checkbox" className="h-4 w-4" checked={form.prefersPublicMeetup} onChange={(e) => set("prefersPublicMeetup", e.target.checked)} />
                Open to public meetup locations
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-700">
                <input type="checkbox" className="h-4 w-4" checked={form.prefersBikeShopMeetup} onChange={(e) => set("prefersBikeShopMeetup", e.target.checked)} />
                Open to meeting at a participating bike shop
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-700">
                <input type="checkbox" className="h-4 w-4" checked={form.prefersLawEnforcement} onChange={(e) => set("prefersLawEnforcement", e.target.checked)} />
                Interested in law-enforcement-supported meetup options (availability varies by location)
              </label>
            </div>
            <div className="mt-4">
              <label className="label">Notes for buyers (optional)</label>
              <textarea className="textarea" rows={2} value={form.meetupNotes} onChange={(e) => set("meetupNotes", e.target.value)} />
            </div>
          </StepShell>
        )}

        {step === 10 && (
          <StepShell title="Preview & publish">
            <div className="overflow-hidden rounded-xl border border-charcoal-100">
              <div className="relative aspect-[16/9] bg-charcoal-50">
                {form.images[0] && <Image src={form.images[0]} alt="" fill className="object-cover" />}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-bold text-charcoal-900">
                  {form.year} {form.brand} {form.model}
                </h3>
                <p className="text-sm text-charcoal-500">
                  {form.frameSize} · {form.city}, {form.state}
                </p>
                <p className="mt-2 font-display text-xl font-extrabold">${form.askingPrice}</p>
                {valuation && <FairPriceBadge label={valuation.pricePositionLabel} className="mt-2" />}
              </div>
            </div>
          </StepShell>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 1}>
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={next} disabled={!canAdvance(step, form)}>
              Continue
            </Button>
          ) : (
            <Button onClick={publish} disabled={publishing} variant="accent">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function canAdvance(step: number, form: WizardState): boolean {
  switch (step) {
    case 1:
      return !!form.category;
    case 2:
      return !!(form.brand && form.model && form.year && form.frameSize && form.frameMaterial);
    case 4:
      return !!(form.condition && form.description.length >= 20);
    case 5:
      return form.images.length > 0;
    case 7:
      return !!form.askingPrice && Number(form.askingPrice) > 0;
    case 9:
      return !!(form.city && form.state);
    default:
      return true;
  }
}

function StepShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-charcoal-900">{title}</h2>
      <div className="mt-5">{children}</div>
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
