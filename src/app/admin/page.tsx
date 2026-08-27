import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";

export const metadata = { title: "Admin — Analytics" };

export default async function AdminAnalyticsPage() {
  const [userCount, activeListings, soldListings, reportsOpen, transactions, listingsByCategory, listingsByCity, topBrands, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.bikeListing.count({ where: { status: "ACTIVE" } }),
    prisma.bikeListing.count({ where: { status: "SOLD" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.transaction.findMany({ where: { status: "COMPLETED" } }),
    prisma.bikeListing.groupBy({ by: ["category"], _count: true, where: { status: "ACTIVE" }, orderBy: { _count: { category: "desc" } } }),
    prisma.bikeListing.groupBy({ by: ["city", "state"], _count: true, where: { status: "ACTIVE" }, orderBy: { _count: { city: "desc" } }, take: 5 }),
    prisma.bikeListing.groupBy({ by: ["brand"], _count: true, where: { status: "ACTIVE" }, orderBy: { _count: { brand: "desc" } }, take: 5 }),
    prisma.paymentRecord.aggregate({ _sum: { amountCents: true } }),
  ]);

  const avgListingPrice = await prisma.bikeListing.aggregate({ where: { status: "ACTIVE" }, _avg: { askingPrice: true } });
  const avgEstimated = await prisma.bikeValuation.aggregate({ where: { isCurrent: true }, _avg: { estimatedMid: true } });
  const totalVolume = transactions.reduce((s, t) => s + t.agreedPrice, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Analytics</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active users" value={userCount} />
        <Stat label="Active listings" value={activeListings} />
        <Stat label="Bikes sold" value={soldListings} />
        <Stat label="Open reports" value={reportsOpen} />
        <Stat label="Completed transactions" value={transactions.length} />
        <Stat label="Transaction volume" value={formatCents(totalVolume)} />
        <Stat label="Avg. listing price" value={formatCents(avgListingPrice._avg.askingPrice ?? 0)} />
        <Stat label="Avg. estimated value" value={formatCents(avgEstimated._avg.estimatedMid ?? 0)} />
        <Stat label="Marketplace revenue" value={formatCents(revenue._sum.amountCents ?? 0)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Popular categories">
          {listingsByCategory.map((c) => (
            <Row key={c.category} label={c.category} value={c._count} />
          ))}
        </Panel>
        <Panel title="Listings by city">
          {listingsByCity.map((c) => (
            <Row key={`${c.city}-${c.state}`} label={`${c.city}, ${c.state}`} value={c._count} />
          ))}
        </Panel>
        <Panel title="Popular brands">
          {topBrands.map((b) => (
            <Row key={b.brand} label={b.brand} value={b._count} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="font-display text-xl font-bold text-charcoal-900">{value}</p>
      <p className="text-xs text-charcoal-500">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-display text-sm font-bold text-charcoal-900">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-charcoal-600">{label}</span>
      <span className="font-medium text-charcoal-900">{value}</span>
    </div>
  );
}
