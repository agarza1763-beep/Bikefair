import { prisma } from "@/lib/prisma";

/**
 * "Local Market Pulse" — a bike-shop-membership perk built entirely from BikeFair's own listing
 * and transaction data (views, listing activity, completed sales), not scraped or aggregated from
 * any public source. This is the thing a shop can't get anywhere else: what's actually moving, at
 * what price, and what's undersupplied, in their own city right now.
 *
 * Data is genuinely thin early on, so this deliberately reports "not enough data yet" per-section
 * rather than padding sparse samples to look more substantial than they are. Every number here
 * measures something real:
 *  - "Trending" views/listing counts are cumulative totals for listings created in the trend
 *    window — not a time-bucketed view-event log (BikeFair doesn't track individual view events,
 *    only a running counter per listing), so we never claim "views this month vs last month."
 *  - "Momentum" (new listings / completed sales per category) IS legitimately time-bucketed, since
 *    listing/transaction creation timestamps are real — this is the one place a period-over-period
 *    percentage is honest to show.
 *  - "Opportunities" compares cumulative views-per-listing against the citywide average — a
 *    snapshot demand/supply ratio, not a trend claim.
 */

const MIN_SAMPLE = 3;
const TREND_WINDOW_DAYS = 90;
const MOMENTUM_WINDOW_DAYS = 30;

export interface CategoryStat {
  category: string;
  totalViews: number;
  listingCount: number;
  isWatched?: boolean;
}
export interface BrandStat {
  brand: string;
  totalViews: number;
  listingCount: number;
  isWatched?: boolean;
}
export interface PriceBenchmark {
  category: string;
  avgAskingCents: number;
  listingCount: number;
}
export interface RecentSale {
  title: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  agreedPriceCents: number;
  daysOnMarket: number | null;
  soldAt: Date;
}
export interface MomentumStat {
  category: string;
  newListingsCurrent: number;
  newListingsPrior: number;
  soldCurrent: number;
  soldPrior: number;
  listingPctChange: number | null; // null when prior period had zero to compare against
}
export interface Opportunity {
  category: string;
  activeListingCount: number;
  totalViews: number;
  viewsPerListing: number;
  cityAvgViewsPerListing: number;
}

export interface MarketPulse {
  scope: "city" | "state" | "none";
  scopeLabel: string;
  activeListingCount: number;
  completedSaleCount: number;
  trendingCategories: CategoryStat[];
  trendingBrands: BrandStat[];
  priceBenchmarks: PriceBenchmark[];
  recentSales: RecentSale[];
  momentum: MomentumStat[];
  opportunities: Opportunity[];
  watchedCategoryStats: CategoryStat[];
  watchedBrandStats: BrandStat[];
}

async function computeMomentum(where: { city?: string; state: string }) {
  const now = Date.now();
  const currentSince = new Date(now - MOMENTUM_WINDOW_DAYS * 86_400_000);
  const priorSince = new Date(now - 2 * MOMENTUM_WINDOW_DAYS * 86_400_000);
  const baseWhere = { ...where, isDemo: false };

  const [currentListings, priorListings, currentSales, priorSales] = await Promise.all([
    prisma.bikeListing.groupBy({ by: ["category"], where: { ...baseWhere, createdAt: { gte: currentSince } }, _count: { _all: true } }),
    prisma.bikeListing.groupBy({ by: ["category"], where: { ...baseWhere, createdAt: { gte: priorSince, lt: currentSince } }, _count: { _all: true } }),
    prisma.transaction.groupBy({
      by: ["listingId"],
      where: { status: "COMPLETED", isDemo: false, createdAt: { gte: currentSince }, listing: { is: where } },
    }),
    prisma.transaction.groupBy({
      by: ["listingId"],
      where: { status: "COMPLETED", isDemo: false, createdAt: { gte: priorSince, lt: currentSince }, listing: { is: where } },
    }),
  ]);

  // Sold counts need a category, which groupBy on transaction can't give directly — pull it via the listings involved.
  const soldListingIds = [...currentSales, ...priorSales].map((s) => s.listingId);
  const soldListings = soldListingIds.length
    ? await prisma.bikeListing.findMany({ where: { id: { in: soldListingIds } }, select: { id: true, category: true } })
    : [];
  const categoryById = new Map(soldListings.map((l) => [l.id, l.category]));
  const currentSoldByCategory = new Map<string, number>();
  const priorSoldByCategory = new Map<string, number>();
  for (const s of currentSales) {
    const cat = categoryById.get(s.listingId);
    if (cat) currentSoldByCategory.set(cat, (currentSoldByCategory.get(cat) ?? 0) + 1);
  }
  for (const s of priorSales) {
    const cat = categoryById.get(s.listingId);
    if (cat) priorSoldByCategory.set(cat, (priorSoldByCategory.get(cat) ?? 0) + 1);
  }

  const currentByCategory = new Map(currentListings.map((c) => [c.category, c._count._all]));
  const priorByCategory = new Map(priorListings.map((c) => [c.category, c._count._all]));
  const allCategories = new Set([...currentByCategory.keys(), ...priorByCategory.keys(), ...currentSoldByCategory.keys(), ...priorSoldByCategory.keys()]);

  const momentum: MomentumStat[] = Array.from(allCategories).map((category) => {
    const newListingsCurrent = currentByCategory.get(category) ?? 0;
    const newListingsPrior = priorByCategory.get(category) ?? 0;
    return {
      category,
      newListingsCurrent,
      newListingsPrior,
      soldCurrent: currentSoldByCategory.get(category) ?? 0,
      soldPrior: priorSoldByCategory.get(category) ?? 0,
      listingPctChange: newListingsPrior > 0 ? Math.round(((newListingsCurrent - newListingsPrior) / newListingsPrior) * 100) : null,
    };
  });

  return momentum
    .filter((m) => m.newListingsCurrent > 0 || m.newListingsPrior > 0 || m.soldCurrent > 0 || m.soldPrior > 0)
    .sort((a, b) => b.newListingsCurrent + b.soldCurrent - (a.newListingsCurrent + a.soldCurrent));
}

async function computeForScope(where: { city?: string; state: string }, since: Date) {
  const listingWhere = { ...where, isDemo: false, status: { in: ["ACTIVE", "SOLD"] }, createdAt: { gte: since } };

  const [categoryAgg, brandAgg, priceAgg, activeCount, sales] = await Promise.all([
    prisma.bikeListing.groupBy({
      by: ["category"],
      where: listingWhere,
      _sum: { viewCount: true },
      _count: { _all: true },
      orderBy: { _sum: { viewCount: "desc" } },
    }),
    prisma.bikeListing.groupBy({
      by: ["brand"],
      where: listingWhere,
      _sum: { viewCount: true },
      _count: { _all: true },
      orderBy: { _sum: { viewCount: "desc" } },
    }),
    prisma.bikeListing.groupBy({
      by: ["category"],
      where: { ...where, isDemo: false, status: "ACTIVE" },
      _avg: { askingPrice: true },
      _count: { _all: true },
    }),
    prisma.bikeListing.count({ where: { ...where, isDemo: false, status: "ACTIVE" } }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED", isDemo: false, createdAt: { gte: since }, listing: { is: where } },
      include: { listing: { select: { title: true, category: true, brand: true, model: true, year: true, publishedAt: true, createdAt: true, soldAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const sampleSize = categoryAgg.reduce((n, c) => n + c._count._all, 0);

  const recentSales: RecentSale[] = sales.map((t) => {
    const start = t.listing.publishedAt ?? t.listing.createdAt;
    const end = t.listing.soldAt ?? t.createdAt;
    const daysOnMarket = start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000)) : null;
    return {
      title: t.listing.title,
      category: t.listing.category,
      brand: t.listing.brand,
      model: t.listing.model,
      year: t.listing.year,
      agreedPriceCents: t.agreedPrice,
      daysOnMarket,
      soldAt: t.listing.soldAt ?? t.createdAt,
    };
  });

  const categoryStats: CategoryStat[] = categoryAgg.map((c) => ({ category: c.category, totalViews: c._sum.viewCount ?? 0, listingCount: c._count._all }));
  const brandStats: BrandStat[] = brandAgg.map((b) => ({ brand: b.brand, totalViews: b._sum.viewCount ?? 0, listingCount: b._count._all }));

  const totalViews = categoryStats.reduce((n, c) => n + c.totalViews, 0);
  const totalListings = categoryStats.reduce((n, c) => n + c.listingCount, 0);
  const cityAvgViewsPerListing = totalListings > 0 ? totalViews / totalListings : 0;

  const opportunities: Opportunity[] = categoryStats
    .filter((c) => c.listingCount > 0 && c.listingCount <= 2)
    .map((c) => ({
      category: c.category,
      activeListingCount: c.listingCount,
      totalViews: c.totalViews,
      viewsPerListing: Math.round((c.totalViews / c.listingCount) * 10) / 10,
      cityAvgViewsPerListing: Math.round(cityAvgViewsPerListing * 10) / 10,
    }))
    .filter((o) => o.viewsPerListing > o.cityAvgViewsPerListing * 1.3)
    .sort((a, b) => b.viewsPerListing - a.viewsPerListing)
    .slice(0, 3);

  return {
    sampleSize,
    activeListingCount: activeCount,
    completedSaleCount: sales.length,
    trendingCategories: categoryStats.slice(0, 5),
    trendingBrands: brandStats.slice(0, 5),
    allCategoryStats: categoryStats,
    allBrandStats: brandStats,
    priceBenchmarks: priceAgg
      .filter((p) => p._count._all > 0)
      .map((p) => ({ category: p.category, avgAskingCents: Math.round(p._avg.askingPrice ?? 0), listingCount: p._count._all })),
    recentSales,
    opportunities,
  };
}

export async function getLocalMarketPulse(
  city: string,
  state: string,
  watchlist?: { categories?: string[]; brands?: string[] }
): Promise<MarketPulse> {
  const since = new Date(Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const watchedCategories = new Set(watchlist?.categories ?? []);
  const watchedBrands = new Set((watchlist?.brands ?? []).map((b) => b.toLowerCase()));

  function withWatchFlags(result: Awaited<ReturnType<typeof computeForScope>>) {
    const watchedCategoryStats = result.allCategoryStats
      .filter((c) => watchedCategories.has(c.category))
      .map((c) => ({ ...c, isWatched: true }));
    const watchedBrandStats = result.allBrandStats
      .filter((b) => watchedBrands.has(b.brand.toLowerCase()))
      .map((b) => ({ ...b, isWatched: true }));
    return { watchedCategoryStats, watchedBrandStats };
  }

  const cityWhere = { city, state };
  const cityResult = await computeForScope(cityWhere, since);
  if (cityResult.sampleSize >= MIN_SAMPLE) {
    const momentum = await computeMomentum(cityWhere);
    const { watchedCategoryStats, watchedBrandStats } = withWatchFlags(cityResult);
    return { scope: "city", scopeLabel: `${city}, ${state}`, ...cityResult, momentum, watchedCategoryStats, watchedBrandStats };
  }

  const stateWhere = { state };
  const stateResult = await computeForScope(stateWhere, since);
  if (stateResult.sampleSize >= MIN_SAMPLE) {
    const momentum = await computeMomentum(stateWhere);
    const { watchedCategoryStats, watchedBrandStats } = withWatchFlags(stateResult);
    return { scope: "state", scopeLabel: state, ...stateResult, momentum, watchedCategoryStats, watchedBrandStats };
  }

  return {
    scope: "none",
    scopeLabel: `${city}, ${state}`,
    activeListingCount: cityResult.activeListingCount,
    completedSaleCount: cityResult.completedSaleCount,
    trendingCategories: [],
    trendingBrands: [],
    priceBenchmarks: [],
    recentSales: [],
    momentum: [],
    opportunities: [],
    watchedCategoryStats: [],
    watchedBrandStats: [],
  };
}
