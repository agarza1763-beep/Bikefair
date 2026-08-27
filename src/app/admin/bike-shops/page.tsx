import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VerifyShopButton } from "./verify-button";
import { MembershipActions } from "./membership-actions";

export const metadata = { title: "Admin — Bike Shops" };

const MEMBERSHIP_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-600",
  NONE: "bg-charcoal-100 text-charcoal-500",
};

export default async function AdminBikeShopsPage() {
  const shops = await prisma.bikeShop.findMany({
    orderBy: [{ membershipStatus: "asc" }, { state: "asc" }, { city: "asc" }],
    include: { ownerUser: { select: { name: true, email: true } } },
  });

  const pendingCount = shops.filter((s) => s.membershipStatus === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal-900">Bike Shops</h1>
          {pendingCount > 0 && <p className="mt-1 text-sm font-medium text-amber-700">{pendingCount} shop signup(s) awaiting review</p>}
        </div>
        <Link href="/admin/bike-shops/new" className="rounded-full bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-700">
          + New Shop
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal-100 bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Owner Account</th>
              <th className="px-4 py-3">Membership</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id} className="border-b border-charcoal-50 last:border-0">
                <td className="px-4 py-3 font-medium text-charcoal-900">
                  <Link href={`/admin/bike-shops/${s.id}`} className="hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-charcoal-600">{s.city}</td>
                <td className="px-4 py-3 text-charcoal-600">{s.state}</td>
                <td className="px-4 py-3 text-charcoal-600">{s.ownerUser ? s.ownerUser.name : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MEMBERSHIP_STYLES[s.membershipStatus] ?? MEMBERSHIP_STYLES.NONE}`}>
                    {s.membershipStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-charcoal-600">{s.isVerified ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/admin/bike-shops/${s.id}`} className="rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:border-charcoal-900">
                      Edit
                    </Link>
                    <MembershipActions bikeShopId={s.id} membershipStatus={s.membershipStatus} hasOwner={!!s.ownerUserId} />
                    <VerifyShopButton bikeShopId={s.id} verified={s.isVerified} />
                  </div>
                </td>
              </tr>
            ))}
            {shops.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-charcoal-400">
                  No bike shops yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
