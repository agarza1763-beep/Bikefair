"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startBikeShopMembershipCheckoutAction } from "@/server/actions/bikeshops";
import { formatCents } from "@/lib/constants";

export function MembershipCheckoutButtons({ bikeShopId, monthlyCents, yearlyCents }: { bikeShopId: string; monthlyCents: number; yearlyCents: number }) {
  const [loading, setLoading] = useState<"MONTH" | "YEAR" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedPerYear = monthlyCents * 12 - yearlyCents;

  async function checkout(interval: "MONTH" | "YEAR") {
    setLoading(interval);
    setError(null);
    const res = await startBikeShopMembershipCheckoutAction(bikeShopId, interval);
    if (res.ok) {
      window.location.href = res.data!.url;
    } else {
      setError(res.error);
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => checkout("MONTH")}
          disabled={loading !== null}
          className="rounded-xl border border-charcoal-200 p-4 text-left transition-colors hover:border-green-600 disabled:opacity-60"
        >
          <p className="text-sm font-semibold text-charcoal-900">Monthly</p>
          <p className="font-display text-xl font-bold text-charcoal-900">{formatCents(monthlyCents)}/mo</p>
          <p className="mt-1 text-xs text-charcoal-500">{loading === "MONTH" ? "Redirecting to checkout…" : "Cancel anytime"}</p>
        </button>
        <button
          type="button"
          onClick={() => checkout("YEAR")}
          disabled={loading !== null}
          className="relative rounded-xl border-2 border-green-600 bg-green-50 p-4 text-left transition-colors disabled:opacity-60"
        >
          <span className="absolute -top-2.5 right-3 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Save {formatCents(savedPerYear)}
          </span>
          <p className="text-sm font-semibold text-charcoal-900">Yearly</p>
          <p className="font-display text-xl font-bold text-charcoal-900">{formatCents(yearlyCents)}/yr</p>
          <p className="mt-1 text-xs text-charcoal-500">{loading === "YEAR" ? "Redirecting to checkout…" : "Equivalent to 2 months free"}</p>
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
