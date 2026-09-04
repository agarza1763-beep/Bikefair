import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://shopbikefair.com";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/browse", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/sell", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/how-it-works", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/check-value", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/value-guide", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/safety", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/safe-exchange-locations", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/bike-shops", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/bike-shops/join", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/community-guidelines", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, shops] = await Promise.all([
    prisma.bikeListing.findMany({ where: { status: "ACTIVE" }, select: { id: true, updatedAt: true }, take: 5000 }),
    prisma.bikeShop.findMany({ where: { membershipStatus: "ACTIVE" }, select: { id: true, updatedAt: true } }),
  ]);

  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...listings.map((l) => ({
      url: `${SITE_URL}/bike/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...shops.map((s) => ({
      url: `${SITE_URL}/bike-shops/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
