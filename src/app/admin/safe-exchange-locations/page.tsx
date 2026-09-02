import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AGENCY_TYPE_LABELS, type AgencyType } from "@/lib/constants";
import { DeleteLocationButton } from "./delete-button";

export const metadata = { title: "Admin — Safe Exchange Locations" };

export default async function AdminSafeExchangeLocationsPage() {
  const locations = await prisma.safeExchangeLocation.findMany({
    orderBy: [{ isActive: "desc" }, { state: "asc" }, { city: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal-900">Safe Exchange Locations</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
            Police departments, sheriff's offices, or other public agencies that have agreed to be listed as a designated meetup spot. These are free — no
            membership or billing, unlike bike shop partners.
          </p>
        </div>
        <Link href="/admin/safe-exchange-locations/new" className="rounded-full bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-700">
          + New Location
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal-100 bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Meetups Hosted</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id} className="border-b border-charcoal-50 last:border-0">
                <td className="px-4 py-3 font-medium text-charcoal-900">
                  <Link href={`/admin/safe-exchange-locations/${l.id}`} className="hover:underline">
                    {l.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-charcoal-600">{AGENCY_TYPE_LABELS[l.agencyType as AgencyType] ?? l.agencyType}</td>
                <td className="px-4 py-3 text-charcoal-600">{l.city}</td>
                <td className="px-4 py-3 text-charcoal-600">{l.state}</td>
                <td className="px-4 py-3 text-charcoal-600">{l.meetupCount}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.isActive ? "bg-green-100 text-green-700" : "bg-charcoal-100 text-charcoal-500"}`}>
                    {l.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/admin/safe-exchange-locations/${l.id}`}
                      className="rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:border-charcoal-900"
                    >
                      Edit
                    </Link>
                    <DeleteLocationButton locationId={l.id} name={l.name} />
                  </div>
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-charcoal-400">
                  No safe exchange locations yet. Add one after an agency agrees to be listed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
