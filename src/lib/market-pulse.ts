import { prisma } from "@/lib/prisma";

/**
 * "Local Market Pulse" — a bike-shop-membership perk built entirely from BikeFair's own listing
 * and transaction data (views, asking prices, completed sales), not scraped or aggregated from any
 * public source. This is the thing a shop can't get anywhere else: what's actually moving, at what
 * price, in their own city right now.
 *
 * Data is genuinely thin early on, so this deliberately reports "not enough data yet" per-section
 * rather than padding sparse samples to look more substantial than they are.
 */

const MIN_SAMPLE = 3;
const WINDOW_DAYS = 90;

export interface CategoryStat {
  category: string;
  totalViews: number;
  listingCount: number;
}
export interface BrandStat {
  brand: string;
  totalViews: number;
  listingCount: number;
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

export interface MarketPulse {
  scope: "city" | "state" | "none";
  scopeLabel: string;
  activeListingCount: number;
  completedSaleCount: number;
  trendingCategories: CategoryStat[];
  trendingBrands: BrandStat[];
  priceBenchmarks: PriceBenchmark[];
  recentSales: RecentSale[];
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
      take: 5,
    }),
    prisma.bikeListing.groupBy({
      by: ["brand"],
      where: listingWhere,
      _sum: { viewCount: true },
      _count: { _all: true },
      orderBy: { _sum: { viewCount: "desc" } },
      take: 5,
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

  return {
    sampleSize,
    activeListingCount: activeCount,
    completedSaleCount: sales.length,
    trendingCategories: categoryAgg.map((c) => ({ category: c.category, totalViews: c._sum.viewCount ?? 0, listingCount: c._count._all })),
    trendingBrands: brandAgg.map((b) => ({ brand: b.brand, totalViews: b._sum.viewCount ?? 0, listingCount: b._count._all })),
    priceBenchmarks: priceAgg
      .filter((p) => p._count._all > 0)
      .map((p) => ({ category: p.category, avgAskingCents: Math.round(p._avg.askingPrice ?? 0), listingCount: p._count._all })),
    recentSales,
  };
}

export async function getLocalMarketPulse(city: string, state: string): Promise<MarketPulse> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const cityResult = await computeForScope({ city, state }, since);
  if (cityResult.sampleSize >= MIN_SAMPLE) {
    return { scope: "city", scopeLabel: `${city}, ${state}`, ...cityResult };
  }

  const stateResult = await computeForScope({ state }, since);
  if (stateResult.sampleSize >= MIN_SAMPLE) {
    return { scope: "state", scopeLabel: state, ...stateResult };
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
  };
}
