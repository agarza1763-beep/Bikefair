import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";
import { ListingAdminRowActions } from "./row-actions";

export const metadata = { title: "Admin — Listings" };

export default async function AdminListingsPage() {
  const listings = await prisma.bikeListing.findMany({
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { name: true } } },
    take: 300,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Listings</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal-100 bg-white">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-charcoal-50 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/bike/${l.id}`} className="font-medium text-charcoal-900 hover:underline">
                    {l.title}
                  </Link>
                  {l.isDemo && <span className="ml-1 text-xs text-charcoal-400">(demo)</span>}
                </td>
                <td className="px-4 py-3 text-charcoal-600">{l.seller.name}</td>
                <td className="px-4 py-3 text-charcoal-600">{formatCents(l.askingPrice)}</td>
                <td className="px-4 py-3 text-charcoal-600">{l.status}</td>
                <td className="px-4 py-3 text-charcoal-600">{l.isFeatured ? "Yes" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <ListingAdminRowActions listingId={l.id} isFeatured={l.isFeatured} removed={l.status === "REMOVED"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
