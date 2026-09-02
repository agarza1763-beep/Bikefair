import Link from "next/link";
import { TrendingUp, Tag, DollarSign, Clock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLocalMarketPulse } from "@/lib/market-pulse";
import { formatCents, BIKE_CATEGORY_LABELS, type BikeCategory } from "@/lib/constants";

export const metadata = { title: "Shop Dashboard — BikeFair" };

export default async function ShopDashboardPage() {
  const user = await requireUser();
  const shop = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id } });

  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Shop Dashboard</h1>
        <p className="mt-2 text-charcoal-500">This is a bike-shop partner perk. Your account isn't linked to a bike shop yet.</p>
        <Link href="/bike-shops/join" className="mt-6 inline-block rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal-700">
          Become a Partner
        </Link>
      </div>
    );
  }

  if (shop.membershipStatus !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Shop Dashboard</h1>
        <p className="mt-2 text-charcoal-500">
          {shop.name}'s membership is currently <strong>{shop.membershipStatus.toLowerCase()}</strong>. Local Market Pulse and other partner tools unlock with an
          active membership.
        </p>
        <Link href="/bike-shops/join" className="mt-6 inline-block rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal-700">
          Reactivate Membership
        </Link>
      </div>
    );
  }

  const pulse = await getLocalMarketPulse(shop.city, shop.state);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">{shop.name}'s Dashboard</h1>
      <p className="mt-1 text-sm text-charcoal-500">Partner-only market intelligence, built from real BikeFair activity — not available anywhere public.</p>

      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Local Market Pulse — {pulse.scopeLabel}</p>
        <p className="mt-1">
          {pulse.scope === "city" && "Based on activity in your city over the last 90 days."}
          {pulse.scope === "state" && "Not enough listings in your city yet, so this is showing statewide data for the last 90 days."}
          {pulse.scope === "none" && "Not enough BikeFair activity in your area yet to show reliable trends. Check back as more listings and sales come in."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MarketCard icon={<TrendingUp className="h-5 w-5" />} title="Trending Categories">
          {pulse.trendingCategories.length === 0 ? (
            <EmptyNote />
          ) : (
            <ul className="space-y-2">
              {pulse.trendingCategories.map((c) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal-700">{BIKE_CATEGORY_LABELS[c.category as BikeCategory] ?? c.category}</span>
                  <span className="text-charcoal-400">
                    {c.totalViews} views · {c.listingCount} listing{c.listingCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MarketCard>

        <MarketCard icon={<Tag className="h-5 w-5" />} title="Trending Brands">
          {pulse.trendingBrands.length === 0 ? (
            <EmptyNote />
          ) : (
            <ul className="space-y-2">
              {pulse.trendingBrands.map((b) => (
                <li key={b.brand} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal-700">{b.brand}</span>
                  <span className="text-charcoal-400">
                    {b.totalViews} views · {b.listingCount} listing{b.listingCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MarketCard>

        <MarketCard icon={<DollarSign className="h-5 w-5" />} title="Local Asking Price Benchmarks">
          {pulse.priceBenchmarks.length === 0 ? (
            <EmptyNote />
          ) : (
            <ul className="space-y-2">
              {pulse.priceBenchmarks.map((p) => (
                <li key={p.category} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal-700">{BIKE_CATEGORY_LABELS[p.category as BikeCategory] ?? p.category}</span>
                  <span className="font-medium text-charcoal-900">
                    avg {formatCents(p.avgAskingCents)}{" "}
                    <span className="font-normal text-charcoal-400">
                      ({p.listingCount} listing{p.listingCount === 1 ? "" : "s"})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MarketCard>

        <MarketCard icon={<Clock className="h-5 w-5" />} title="Recently Sold Nearby">
          {pulse.recentSales.length === 0 ? (
            <EmptyNote />
          ) : (
            <ul className="space-y-2">
              {pulse.recentSales.map((s, i) => (
                <li key={i} className="text-sm">
                  <p className="text-charcoal-700">
                    {s.year} {s.brand} {s.model}
                  </p>
                  <p className="text-charcoal-400">
                    {formatCents(s.agreedPriceCents)}
                    {s.daysOnMarket !== null && ` · ${s.daysOnMarket} day${s.daysOnMarket === 1 ? "" : "s"} on market`} · {s.soldAt.toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </MarketCard>
      </div>

      <p className="mt-6 text-xs text-charcoal-400">
        Figures come from BikeFair listings and completed transactions only — not a public data source, and not shared outside partner accounts. Small sample sizes
        can shift quickly; treat these as directional, not exact.
      </p>
    </div>
  );
}

function MarketCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">{icon}</span>
        <h2 className="font-display text-sm font-bold text-charcoal-900">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyNote() {
  return <p className="text-sm text-charcoal-400">Not enough data yet in your area.</p>;
}
