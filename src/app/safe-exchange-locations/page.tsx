import Link from "next/link";
import { Landmark, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { US_STATES, AGENCY_TYPE_LABELS, type AgencyType, BRAND_NAME } from "@/lib/constants";

export const metadata = { title: "Safe Exchange Locations — BikeFair" };

export default async function SafeExchangeLocationsPage({ searchParams }: { searchParams: Promise<{ state?: string; city?: string }> }) {
  const { state, city } = await searchParams;

  const locations = await prisma.safeExchangeLocation.findMany({
    where: {
      isActive: true,
      ...(state ? { state } : {}),
      ...(city ? { city: { contains: city } } : {}),
    },
    orderBy: [{ state: "asc" }, { city: "asc" }],
  });

  const grouped = locations.reduce<Record<string, typeof locations>>((acc, loc) => {
    (acc[loc.state] ??= []).push(loc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">Safe Exchange Locations</h1>
      <p className="mt-3 max-w-2xl text-charcoal-600">
        These police departments, sheriff's offices, and other public agencies have agreed to serve as designated meetup spots for BikeFair transactions — often a
        lobby or a monitored parking area. <strong>{BRAND_NAME} does not employ, dispatch, or pay these agencies, and they are not a party to any transaction.</strong>{" "}
        See our{" "}
        <Link href="/safety" className="text-green-700 underline">
          Safety Center
        </Link>{" "}
        for details, and verify current availability and any rules directly with the agency before relying on it.
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-charcoal-100 bg-white p-4" method="get">
        <label className="block">
          <span className="label">State</span>
          <select name="state" defaultValue={state ?? ""} className="input">
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">City</span>
          <input name="city" defaultValue={city ?? ""} placeholder="e.g. Austin" className="input" />
        </label>
        <button type="submit" className="rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal-700">
          Filter
        </button>
        {(state || city) && (
          <Link href="/safe-exchange-locations" className="text-sm font-medium text-charcoal-500 hover:text-green-700">
            Clear
          </Link>
        )}
      </form>

      {locations.length === 0 ? (
        <p className="mt-10 text-center text-charcoal-500">
          No safe exchange locations listed yet{state || city ? " for that area" : ""}. Know a local department that should be? Have them reach out through our{" "}
          <Link href="/safety" className="text-green-700 underline">
            Safety Center
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {Object.entries(grouped).map(([stateCode, stateLocations]) => (
            <div key={stateCode}>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-charcoal-400">{stateCode}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {stateLocations.map((loc) => (
                  <div key={loc.id} className="card p-5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-display text-lg font-bold text-charcoal-900">{loc.name}</h3>
                      <Landmark className="h-5 w-5 shrink-0 text-green-600" />
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-charcoal-500">
                      <MapPin className="h-3.5 w-3.5" /> {loc.address}, {loc.city}, {loc.state}
                    </p>
                    <p className="mt-2 text-xs font-medium text-green-700">{AGENCY_TYPE_LABELS[loc.agencyType as AgencyType] ?? loc.agencyType}</p>
                    {loc.phone && <p className="mt-1 text-xs text-charcoal-500">{loc.phone}</p>}
                    {loc.notes && <p className="mt-2 text-xs text-charcoal-500">{loc.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
