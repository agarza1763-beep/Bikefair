import { prisma } from "@/lib/prisma";
import { distanceMiles, type GeoPoint } from "@/lib/geo";
import { isRecognizedBrand } from "@/lib/brands";
import { getRecognizedBrandNames } from "./brands";
import type { BikeCardData } from "@/components/bike/bike-card";
import type { PricePositionLabel } from "@/lib/constants";

const listingWithRelations = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  valuations: { where: { isCurrent: true }, take: 1 },
  seller: { select: { id: true, name: true, image: true, verificationLevel: true, isTrustedSeller: true } },
};

export function toBikeCardData(
  listing: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    frameSize: string;
    askingPrice: number;
    city: string;
    state: string;
    images: { url: string }[];
    seller: { name: string; image?: string | null; verificationLevel: string };
    valuations: { estimatedLow: number; estimatedHigh: number; pricePositionLabel: string }[];
    isShopInventory?: boolean;
  },
  recognizedBrandNames: string[] = []
): BikeCardData {
  const val = listing.valuations[0];
  return {
    id: listing.id,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    category: listing.category as BikeCardData["category"],
    frameSize: listing.frameSize,
    askingPrice: listing.askingPrice,
    city: listing.city,
    state: listing.state,
    imageUrl: listing.images[0]?.url,
    sellerName: listing.seller.name,
    sellerImage: listing.seller.image ?? null,
    sellerVerificationLevel: listing.seller.verificationLevel,
    estimatedLowCents: val?.estimatedLow ?? null,
    estimatedHighCents: val?.estimatedHigh ?? null,
    pricePositionLabel: (val?.pricePositionLabel as PricePositionLabel) ?? null,
    isRecognizedBrand: recognizedBrandNames.length > 0 ? isRecognizedBrand(listing.brand, recognizedBrandNames) : undefined,
    isShopInventory: listing.isShopInventory,
  };
}

export interface BrowseFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  condition?: string;
  frameMaterial?: string;
  state?: string;
  city?: string;
  ebikeOnly?: boolean;
  verifiedOnly?: boolean;
  recognizedBrandOnly?: boolean;
  fairPriceOnly?: boolean;
  belowFairValue?: boolean;
  aboveFairValue?: boolean;
  near?: GeoPoint;
  maxDistanceMiles?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "distance";
  q?: string;
}

export async function fetchListings(filters: BrowseFilters) {
  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (filters.category) where.category = filters.category;
  if (filters.ebikeOnly) where.category = "EBIKE";
  if (filters.brand) where.brand = { contains: filters.brand };
  if (filters.condition) where.condition = filters.condition;
  if (filters.frameMaterial) where.frameMaterial = filters.frameMaterial;
  if (filters.state) where.state = filters.state;
  if (filters.city) where.city = { contains: filters.city };
  if (filters.minYear) where.year = { gte: filters.minYear };
  if (filters.minPrice || filters.maxPrice) {
    where.askingPrice = {
      ...(filters.minPrice ? { gte: filters.minPrice * 100 } : {}),
      ...(filters.maxPrice ? { lte: filters.maxPrice * 100 } : {}),
    };
  }
  if (filters.verifiedOnly) where.seller = { verificationLevel: { not: "BASIC" } };
  if (filters.q) {
    where.OR = [{ brand: { contains: filters.q } }, { model: { contains: filters.q } }, { title: { contains: filters.q } }];
  }

  let listings = await prisma.bikeListing.findMany({
    where,
    include: listingWithRelations,
    omit: { serialNumber: true },
    orderBy: filters.sort === "price_asc" ? { askingPrice: "asc" } : filters.sort === "price_desc" ? { askingPrice: "desc" } : { publishedAt: "desc" },
    take: 200,
  });

  if (filters.fairPriceOnly || filters.belowFairValue || filters.aboveFairValue) {
    listings = listings.filter((l) => {
      const label = l.valuations[0]?.pricePositionLabel;
      if (filters.fairPriceOnly) return label === "FAIR";
      if (filters.belowFairValue) return label === "SLIGHTLY_BELOW" || label === "SIGNIFICANTLY_BELOW";
      if (filters.aboveFairValue) return label === "SLIGHTLY_ABOVE" || label === "SIGNIFICANTLY_ABOVE";
      return true;
    });
  }

  if (filters.recognizedBrandOnly) {
    const recognizedBrandNames = await getRecognizedBrandNames();
    listings = listings.filter((l) => isRecognizedBrand(l.brand, recognizedBrandNames));
  }

  let withDistance = listings.map((l) => ({
    ...l,
    distanceMiles: filters.near && l.lat != null && l.lng != null ? distanceMiles(filters.near, { lat: l.lat, lng: l.lng }) : null,
  }));

  if (filters.near && filters.maxDistanceMiles) {
    withDistance = withDistance.filter((l) => l.distanceMiles != null && l.distanceMiles <= filters.maxDistanceMiles!);
  }
  if (filters.sort === "distance" && filters.near) {
    withDistance.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
  }

  return withDistance;
}

export async function fetchListingDetail(id: string) {
  const listing = await prisma.bikeListing.findUnique({
    where: { id },
    omit: { serialNumber: true },
    include: {
      images: { orderBy: { position: "asc" } },
      components: true,
      valuations: { where: { isCurrent: true }, take: 1 },
      seller: {
        select: {
          id: true,
          name: true,
          image: true,
          verificationLevel: true,
          isTrustedSeller: true,
          createdAt: true,
          reviewsReceived: { select: { overallRating: true } },
          transactionsAsSeller: { where: { status: "COMPLETED" }, select: { id: true } },
        },
      },
    },
  });
  return listing;
}

export async function fetchFeaturedListings(limit = 8) {
  const [listings, recognizedBrandNames] = await Promise.all([
    prisma.bikeListing.findMany({
      where: { status: "ACTIVE" },
      include: listingWithRelations,
      omit: { serialNumber: true },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: limit,
    }),
    getRecognizedBrandNames(),
  ]);
  return listings.map((l) => toBikeCardData(l, recognizedBrandNames));
}
