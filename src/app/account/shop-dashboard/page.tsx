import Link from "next/link";
import { TrendingUp, Tag, DollarSign, Clock, Star, Sparkles, ArrowUp, ArrowDown, Calculator } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLocalMarketPulse } from "@/lib/market-pulse";
import { formatCents, BIKE_CATEGORY_LABELS, type BikeCategory } from "@/lib/constants";
import { WatchlistEditor } from "@/components/account/watchlist-editor";

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

  const watchedCategories: string[] = shop.watchedCategories ? JSON.parse(shop.watchedCategories) : [];
  const watchedBrands: string[] = shop.watchedBrands ? JSON.parse(shop.watchedBrands) : [];
  const pulse = await getLocalMarketPulse(shop.city, shop.state, { categories: watchedCategories, brands: watchedBrands });

  const hasFocus = pulse.watchedCategoryStats.length > 0 || pulse.watchedBrandStats.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal-900">{shop.name}'s Dashboard</h1>
          <p className="mt-1 text-sm text-charcoal-500">Partner-only market intelligence, built from real BikeFair activity — not available anywhere public.</p>
        </div>
        <WatchlistEditor initialCategories={watchedCategories} initialBrands={watchedBrands} />
      </div>

      <Link
        href="/account/shop-dashboard/trade-in"
        className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-dashed border-green-600 bg-green-50 p-5 transition-colors hover:bg-green-100"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
          <Calculator className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-display text-base font-bold text-green-900">Trade-In Calculator</p>
          <p className="text-sm text-green-800">Price a customer's trade-in on the spot, then list it as used inventory to run your own resale market on BikeFair.</p>
        </div>
        <span className="shrink-0 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white">Open →</span>
      </Link>

      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Local Market Pulse — {pulse.scopeLabel}</p>
        <p className="mt-1">
          {pulse.scope === "city" && "Based on activity in your city over the last 90 days."}
          {pulse.scope === "state" && "Not enough listings in your city yet, so this is showing statewide data for the last 90 days."}
          {pulse.scope === "none" && "Not enough BikeFair activity in your area yet to show reliable trends. Check back as more listings and sales come in."}
        </p>
      </div>

      {hasFocus && (
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-charcoal-400">
            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-600" /> Your Focus
          </h2>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {pulse.watchedCategoryStats.length > 0 && (
              <MarketCard icon={<TrendingUp className="h-5 w-5" />} title="Watched Categories">
                <ul className="space-y-2">
                  {pulse.watchedCategoryStats.map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal-700">{BIKE_CATEGORY_LABELS[c.category as BikeCategory] ?? c.category}</span>
                      <span className="text-charcoal-400">
                        {c.totalViews} views · {c.listingCount} listing{c.listingCount === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </MarketCard>
            )}
            {pulse.watchedBrandStats.length > 0 && (
              <MarketCard icon={<Tag className="h-5 w-5" />} title="Watched Brands">
                <ul className="space-y-2">
                  {pulse.watchedBrandStats.map((b) => (
                    <li key={b.brand} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal-700">{b.brand}</span>
                      <span className="text-charcoal-400">
                        {b.totalViews} views · {b.listingCount} listing{b.listingCount === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </MarketCard>
            )}
          </div>
        </div>
      )}

      {pulse.opportunities.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-charcoal-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Opportunities
          </h2>
          <div className="mt-2 space-y-2">
            {pulse.opportunities.map((o) => (
              <div key={o.category} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="font-medium text-amber-900">
                  {BIKE_CATEGORY_LABELS[o.category as BikeCategory] ?? o.category} — high demand, low local supply
                </p>
                <p className="mt-1 text-amber-800">
                  Getting {o.viewsPerListing} views per listing here, vs a {o.cityAvgViewsPerListing} average across all categories — but only {o.activeListingCount}{" "}
                  active listing{o.activeListingCount === 1 ? "" : "s"} in your area. Worth stocking or seeking trade-ins for.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pulse.momentum.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-charcoal-400">Momentum — last 30 days vs. prior 30</h2>
          <div className="mt-2 card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">New listings</th>
                  <th className="px-4 py-2.5">Sold</th>
                </tr>
              </thead>
              <tbody>
                {pulse.momentum.map((m) => (
                  <tr key={m.category} className="border-b border-charcoal-50 last:border-0">
                    <td className="px-4 py-2.5 text-charcoal-700">{BIKE_CATEGORY_LABELS[m.category as BikeCategory] ?? m.category}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-charcoal-900">{m.newListingsCurrent}</span>
                      <span className="text-charcoal-400"> (was {m.newListingsPrior})</span>
                      {m.listingPctChange !== null && (
                        <span className={`ml-1.5 inline-flex items-center text-xs font-medium ${m.listingPctChange >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {m.listingPctChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(m.listingPctChange)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-charcoal-700">
                      {m.soldCurrent} <span className="text-charcoal-400">(was {m.soldPrior})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
