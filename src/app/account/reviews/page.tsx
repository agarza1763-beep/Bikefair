import { Star } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My Reviews" };

export default async function AccountReviewsPage() {
  const user = await requireUser();
  const reviews = await prisma.review.findMany({
    where: { revieweeId: user.id },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { name: true } }, transaction: { include: { listing: { select: { title: true } } } } },
  });

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">My Reviews</h1>
      {reviews.length > 0 && (
        <p className="mt-1 flex items-center gap-1 text-sm text-charcoal-500">
          <Star className="h-4 w-4 fill-accent-500 text-accent-600" /> {avg.toFixed(1)} average from {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="mt-8 text-center text-charcoal-500">No reviews yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-charcoal-900">{r.reviewer.name}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent-500 text-accent-600" />
                  <span className="text-sm font-medium">{r.overallRating}/5</span>
                </div>
              </div>
              <p className="text-xs text-charcoal-400">Re: {r.transaction.listing.title}</p>
              {r.comment && <p className="mt-2 text-sm text-charcoal-700">{r.comment}</p>}
              <div className="mt-2 flex gap-3 text-xs text-charcoal-400">
                <span>Communication {r.communicationRating}/5</span>
                <span>Reliability {r.reliabilityRating}/5</span>
                <span>Accuracy {r.accuracyRating}/5</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
