"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { upsertSafeExchangeLocationAction } from "@/server/actions/admin";
import { US_STATES, AGENCY_TYPES, AGENCY_TYPE_LABELS, type AgencyType } from "@/lib/constants";

export interface LocationFormValues {
  id?: string;
  name: string;
  agencyType: AgencyType;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  notes: string;
  isActive: boolean;
}

export function LocationForm({ initial }: { initial?: LocationFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<LocationFormValues>(
    initial ?? { name: "", agencyType: "POLICE", address: "", city: "", state: "", zip: "", phone: "", notes: "", isActive: true }
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertSafeExchangeLocationAction(form.id ?? null, {
        name: form.name,
        agencyType: form.agencyType,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        phone: form.phone,
        notes: form.notes,
        isActive: form.isActive,
      });
      if (!res.ok) return setError(res.error);
      router.push("/admin/safe-exchange-locations");
      router.refresh();
    });
  }

  return (
    <div className="card space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Agency name">
          <input className="input" placeholder="e.g. Springfield Police Department" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Agency type">
          <select className="input" value={form.agencyType} onChange={(e) => set("agencyType", e.target.value as AgencyType)}>
            {AGENCY_TYPES.map((t) => (
              <option key={t} value={t}>
                {AGENCY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Street address" className="sm:col-span-2">
          <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="ZIP">
          <input className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
        </Field>
        <Field label="Phone (non-emergency line)">
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </div>

      <Field label="Notes (shown to users, e.g. where in the building, camera coverage, hours)">
        <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      <div className="flex items-center gap-6 border-t border-charcoal-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-charcoal-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Active (appears as a meetup option and on the public directory)
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push("/admin/safe-exchange-locations")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isPending || !form.name || !form.address || !form.city || !form.state}>
          {form.id ? "Save Changes" : "Create Location"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
