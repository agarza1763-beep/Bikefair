import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";

export const metadata = { title: "Admin — Transactions" };

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true } }, buyer: { select: { name: true } }, seller: { select: { name: true } } },
    take: 300,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Transactions</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal-100 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
            <tr>
              <th className="px-4 py-3">Bike</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Agreed Price</th>
              <th className="px-4 py-3">Closing Fee</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-charcoal-50 last:border-0">
                <td className="px-4 py-3 font-medium text-charcoal-900">
                  {t.listing.title} {t.isDemo && <span className="text-xs text-charcoal-400">(demo)</span>}
                </td>
                <td className="px-4 py-3 text-charcoal-600">{t.buyer.name}</td>
                <td className="px-4 py-3 text-charcoal-600">{t.seller.name}</td>
                <td className="px-4 py-3 text-charcoal-600">{formatCents(t.agreedPrice)}</td>
                <td className="px-4 py-3 text-charcoal-600">{t.sellerClosingFeeCents ? formatCents(t.sellerClosingFeeCents) : "—"}</td>
                <td className="px-4 py-3 text-charcoal-600">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
