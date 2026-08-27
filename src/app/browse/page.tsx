import { Suspense } from "react";
import { BrowseFiltersPanel } from "@/components/bike/browse-filters";
import { BikeCard } from "@/components/bike/bike-card";
import { fetchListings, toBikeCardData } from "@/server/queries/listings";
import { getRecognizedBrandNames } from "@/server/queries/brands";
import { SearchX } from "lucide-react";

export const metadata = { title: "Browse Bikes — BikeFair" };

type SearchParams = Record<string, string | undefined>;

export default async function BrowsePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  const recognizedBrandNames = await getRecognizedBrandNames();

  const listings = await fetchListings({
    category: sp.category,
    brand: sp.brand,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    minYear: sp.minYear ? Number(sp.minYear) : undefined,
    condition: sp.condition,
    frameMaterial: sp.frameMaterial,
    state: sp.state,
    ebikeOnly: sp.ebikeOnly === "1",
    verifiedOnly: sp.verifiedOnly === "1",
    recognizedBrandOnly: sp.recognizedBrandOnly === "1",
    fairPriceOnly: sp.fairPriceOnly === "1",
    belowFairValue: sp.belowFairValue === "1",
    aboveFairValue: sp.aboveFairValue === "1",
    q: sp.q,
    sort: (sp.sort as "newest" | "price_asc" | "price_desc") ?? "newest",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal-900">Browse Bikes</h1>
          <p className="mt-1 text-charcoal-500">{listings.length} active listing{listings.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <Suspense>
            <BrowseFiltersPanel />
          </Suspense>
        </aside>

        <div>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal-200 py-24 text-center">
              <SearchX className="h-10 w-10 text-charcoal-300" />
              <p className="mt-4 font-display text-lg font-bold text-charcoal-700">No bikes match those filters</p>
              <p className="mt-1 text-sm text-charcoal-500">Try widening your price range or clearing a filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <BikeCard key={listing.id} bike={toBikeCardData(listing, recognizedBrandNames)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
