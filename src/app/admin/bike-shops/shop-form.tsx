"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { upsertBikeShopAction } from "@/server/actions/admin";
import { US_STATES, centsToDollarsInput } from "@/lib/constants";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface ShopFormValues {
  id?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  offersInspection: boolean;
  inspectionFee: string;
  isVerified: boolean;
  hours: Record<string, string>;
}

const emptyHours = Object.fromEntries(DAYS.map((d) => [d, ""]));

export function ShopForm({ initial }: { initial?: ShopFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<ShopFormValues>(
    initial ?? { name: "", description: "", address: "", city: "", state: "", zip: "", phone: "", email: "", website: "", offersInspection: false, inspectionFee: "", isVerified: false, hours: emptyHours }
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ShopFormValues>(key: K, value: ShopFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertBikeShopAction(form.id ?? null, {
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
        isVerified: form.isVerified,
        hours: Object.fromEntries(Object.entries(form.hours).filter(([, v]) => v)),
      });
      if (!res.ok) return setError(res.error);
      router.push("/admin/bike-shops");
      router.refresh();
    });
  }

  return (
    <div className="card space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shop name">
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </div>

      <Field label="Description (shown on the shop's public page)">
        <textarea className="textarea" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

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
        <Field label="Contact email">
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Website">
          <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
      </div>

      <div>
        <p className="label">Hours</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAYS.map((day) => (
            <label key={day} className="block">
              <span className="text-xs text-charcoal-400">{day}</span>
              <input
                className="input"
                placeholder="10am–7pm or Closed"
                value={form.hours[day] ?? ""}
                onChange={(e) => set("hours", { ...form.hours, [day]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-t border-charcoal-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-charcoal-700">
          <input type="checkbox" checked={form.offersInspection} onChange={(e) => set("offersInspection", e.target.checked)} />
          Offers optional professional inspection / tune-up service
        </label>
        {form.offersInspection && (
          <label className="flex items-center gap-2 text-sm text-charcoal-700">
            Fee ($)
            <input className="input w-24" type="number" value={form.inspectionFee} onChange={(e) => set("inspectionFee", e.target.value)} />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-charcoal-700">
          <input type="checkbox" checked={form.isVerified} onChange={(e) => set("isVerified", e.target.checked)} />
          Verified (shows the ✓ badge and appears as a meetup option)
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push("/admin/bike-shops")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isPending || !form.name || !form.address || !form.city || !form.state}>
          {form.id ? "Save Changes" : "Create Bike Shop"}
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

export function centsToInspectionFeeInput(cents: number | null) {
  return centsToDollarsInput(cents);
}
