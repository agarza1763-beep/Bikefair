import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SerialRowActions } from "./row-actions";

export const metadata = { title: "Admin — Fraud / Safety" };

export default async function AdminSerialNumbersPage() {
  const reviews = await prisma.serialNumberReview.findMany({
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { id: true, title: true, serialNumber: true, seller: { select: { name: true, email: true } } } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Fraud / Safety — Serial Number Reviews</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        Internal only. Serial numbers are never shown to other users. Reviewing a match should never result in a public accusation without further investigation —
        use the status field and admin notes to track findings.
      </p>

      <div className="mt-6 space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/bike/${r.listing.id}`} className="font-medium text-charcoal-900 hover:underline">
                  {r.listing.title}
                </Link>
                <p className="text-xs text-charcoal-500">
                  Seller: {r.listing.seller.name} ({r.listing.seller.email})
                </p>
                <p className="mt-1 font-mono text-sm text-charcoal-700">Serial: {r.listing.serialNumber ?? "—"}</p>
              </div>
              <span className="rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">{r.status}</span>
            </div>
            <SerialRowActions serialReviewId={r.id} currentStatus={r.status} currentNotes={r.adminNotes ?? ""} />
          </div>
        ))}
        {reviews.length === 0 && <p className="text-charcoal-500">No serial numbers submitted yet.</p>}
      </div>
    </div>
  );
}
