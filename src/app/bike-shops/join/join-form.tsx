"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitBikeShopSignupAction } from "@/server/actions/bikeshops";
import { US_STATES, formatCents } from "@/lib/constants";

export function JoinForm({ feeCents }: { feeCents: number }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    website: "",
    offersInspection: false,
    inspectionFee: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitBikeShopSignupAction({
        name: form.name,
        description: form.description,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        phone: form.phone,
        email: form.email,
        website: form.website,
        offersInspection: form.offersInspection,
        inspectionFee: form.inspectionFee ? Number(form.inspectionFee) : undefined,
      });
      if (!res.ok) return setError(res.error);
      router.push("/bike-shops/join");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shop name">
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </div>

      <Field label="Street address">
        <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="State">
          <select className="input" value={form.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Select…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ZIP">
          <input className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact email">
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Website (optional)">
          <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
      </div>

      <Field label="Description (optional — shown on your public shop page)">
        <textarea className="textarea" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <div className="flex flex-wrap items-center gap-4 border-t border-charcoal-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-charcoal-700">
          <input type="checkbox" checked={form.offersInspection} onChange={(e) => set("offersInspection", e.target.checked)} />
          We'll offer optional paid professional inspections/tune-ups
        </label>
        {form.offersInspection && (
          <label className="flex items-center gap-2 text-sm text-charcoal-700">
            Fee ($)
            <input className="input w-24" type="number" value={form.inspectionFee} onChange={(e) => set("inspectionFee", e.target.value)} />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={submit} disabled={isPending || !form.name || !form.address || !form.city || !form.state} className="w-full">
        Submit Signup Request — {formatCents(feeCents)}/month
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
