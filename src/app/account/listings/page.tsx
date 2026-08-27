import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCents, LISTING_STATUSES } from "@/lib/constants";
import { ListingRowActions } from "./listing-row-actions";

export const metadata = { title: "My Listings — BikeFair" };

export default async function AccountListingsPage() {
  const user = await requireUser();
  const listings = await prisma.bikeListing.findMany({
    where: { sellerId: user.id, status: { in: [...LISTING_STATUSES] } },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1, orderBy: { position: "asc" } }, valuations: { where: { isCurrent: true }, take: 1 } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-charcoal-900">My Listings</h1>
        <Link href="/sell/create" className="text-sm font-medium text-green-700 hover:underline">
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-8 text-center text-charcoal-500">You haven't listed any bikes yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
                {l.images[0] && <Image src={l.images[0].url} alt="" fill className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/bike/${l.id}`} className="truncate font-medium text-charcoal-900 hover:underline">
                  {l.title}
                </Link>
                <p className="text-sm text-charcoal-500">
                  {formatCents(l.askingPrice)} · <span className="uppercase">{l.status}</span> · {l.viewCount} views
                </p>
              </div>
              <ListingRowActions listingId={l.id} status={l.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
