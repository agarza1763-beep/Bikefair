import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";
import { ReviewPrompt } from "./review-prompt";

export const metadata = { title: "Transaction History" };

export default async function TransactionsPage() {
  const user = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { listing: true, buyer: { select: { id: true, name: true } }, seller: { select: { id: true, name: true } }, reviews: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Transaction History</h1>

      {transactions.length === 0 ? (
        <p className="mt-8 text-center text-charcoal-500">No transactions yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {transactions.map((t) => {
            const isBuyer = t.buyerId === user.id;
            const otherParty = isBuyer ? t.seller : t.buyer;
            const myReview = t.reviews.find((r) => r.reviewerId === user.id);
            return (
              <div key={t.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/bike/${t.listingId}`} className="font-medium text-charcoal-900 hover:underline">
                    {t.listing.title}
                  </Link>
                  <span className="rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">{t.status.toLowerCase()}</span>
                </div>
                <p className="mt-1 text-sm text-charcoal-500">
                  {isBuyer ? "Bought from" : "Sold to"} {otherParty.name} · {formatCents(t.agreedPrice)}
                </p>
                {t.sellerClosingFeeCents && !isBuyer ? (
                  <p className="text-xs text-charcoal-400">Marketplace seller closing fee: {formatCents(t.sellerClosingFeeCents)} (website fee, separate from the bicycle's sale price)</p>
                ) : null}
                {t.status === "COMPLETED" && !myReview && <ReviewPrompt transactionId={t.id} />}
                {myReview && <p className="mt-2 text-xs text-green-700">You rated this transaction {myReview.overallRating}/5.</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
