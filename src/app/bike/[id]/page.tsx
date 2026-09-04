import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ShieldCheck, Star } from "lucide-react";
import { fetchListingDetail } from "@/server/queries/listings";
import { getRecognizedBrandNames } from "@/server/queries/brands";
import { incrementViewCountAction } from "@/server/actions/listings";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isRecognizedBrand } from "@/lib/brands";
import { PhotoGallery } from "@/components/bike/photo-gallery";
import { FairPriceBadge } from "@/components/bike/fair-price-badge";
import { UnrecognizedBrandBadge } from "@/components/bike/unrecognized-brand-badge";
import { ValuationBreakdown } from "@/components/bike/valuation-breakdown";
import { ListingActions } from "@/components/bike/listing-actions";
import {
  BIKE_CATEGORY_LABELS,
  CONDITION_LABELS,
  FRAME_MATERIAL_LABELS,
  MILEAGE_LABELS,
  SERIAL_STATUS_LABELS,
  formatCents,
  type MileageLevel,
  type PricePositionLabel,
} from "@/lib/constants";

export default async function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await fetchListingDetail(id);
  if (!listing || listing.status === "REMOVED") notFound();

  incrementViewCountAction(id).catch(() => {});
  const user = await currentUser();

  const saved = user ? !!(await prisma.savedListing.findUnique({ where: { userId_listingId: { userId: user.id, listingId: id } } })) : false;
  const recognizedBrandNames = await getRecognizedBrandNames();
  const brandIsRecognized = isRecognizedBrand(listing.brand, recognizedBrandNames);
  const val = listing.valuations[0];
  const breakdown = val ? (JSON.parse(val.breakdown) as { label: string; amountCents: number; note?: string }[]) : [];
  const avgRating = listing.seller.reviewsReceived.length
    ? listing.seller.reviewsReceived.reduce((s, r) => s + r.overallRating, 0) / listing.seller.reviewsReceived.length
    : null;
  const accountAgeDays = Math.floor((Date.now() - listing.seller.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const specs: [string, string | null][] = [
    ["Brand", listing.brand],
    ["Model", listing.model],
    ["Year", String(listing.year)],
    ["Size", listing.frameSize],
    ["Color", listing.color],
    ["Frame material", FRAME_MATERIAL_LABELS[listing.frameMaterial as keyof typeof FRAME_MATERIAL_LABELS]],
    ["Groupset", listing.groupset],
    ["Wheelset", listing.wheelset],
    ["Wheel size", listing.wheelSize],
    ["Brakes", listing.brakeType],
    ["Suspension", listing.suspension],
    ["Mileage / use", listing.mileageLevel ? MILEAGE_LABELS[listing.mileageLevel as MileageLevel] : null],
    ["Condition", CONDITION_LABELS[listing.condition as keyof typeof CONDITION_LABELS]],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 text-xs text-charcoal-400">
        <Link href="/browse" className="hover:text-green-700">
          Browse
        </Link>{" "}
        / {BIKE_CATEGORY_LABELS[listing.category as keyof typeof BIKE_CATEGORY_LABELS]}
      </nav>

      {listing.status === "SOLD" && (
        <div className="mb-4 rounded-xl bg-charcoal-900 px-4 py-2.5 text-sm font-medium text-white">This bike has been marked as sold.</div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <PhotoGallery images={listing.images} title={listing.title} />

          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-charcoal-900">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal-700">{listing.description}</p>
            {listing.upgrades && (
              <>
                <h3 className="mt-4 font-display text-sm font-bold text-charcoal-900">Upgrades</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-charcoal-700">{listing.upgrades}</p>
              </>
            )}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-charcoal-900">Specifications</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {specs
                .filter(([, v]) => !!v)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-charcoal-100 py-2 text-sm">
                    <dt className="text-charcoal-500">{label}</dt>
                    <dd className="font-medium text-charcoal-900">{value}</dd>
                  </div>
                ))}
              <div className="flex justify-between border-b border-charcoal-100 py-2 text-sm">
                <dt className="text-charcoal-500">Serial number status</dt>
                <dd className="font-medium text-charcoal-900">{SERIAL_STATUS_LABELS[listing.serialStatus as keyof typeof SERIAL_STATUS_LABELS]}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-charcoal-400">Full serial numbers are kept internal and are never displayed publicly.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h1 className="font-display text-2xl font-bold text-charcoal-900">{listing.title}</h1>
            <p className="mt-1 text-sm text-charcoal-500">
              {listing.frameSize} · {listing.city}, {listing.state}
            </p>
            <p className="mt-4 font-display text-3xl font-extrabold text-charcoal-900">{formatCents(listing.askingPrice)}</p>
            {listing.isShopInventory && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-green-700">New shop inventory</p>}
            {val && !listing.isShopInventory && (
              <div className="mt-2 flex items-center gap-2">
                <FairPriceBadge label={val.pricePositionLabel as PricePositionLabel} />
                <span className="text-xs text-charcoal-500">
                  Fair value: {formatCents(val.estimatedLow)}–{formatCents(val.estimatedHigh)}
                </span>
              </div>
            )}

            {!brandIsRecognized && (
              <div className="mt-4">
                <UnrecognizedBrandBadge isEbike={listing.category === "EBIKE"} />
              </div>
            )}

            <div className="mt-6">
              <ListingActions listingId={listing.id} isOwnListing={user?.id === listing.sellerId} initiallySaved={saved} askingPriceCents={listing.askingPrice} />
            </div>
          </div>

          {val && breakdown.length > 0 && !listing.isShopInventory && (
            <ValuationBreakdown
              breakdown={breakdown}
              estimatedLowCents={val.estimatedLow}
              estimatedHighCents={val.estimatedHigh}
              askingPriceCents={val.askingPriceSnapshot}
              pricePositionPct={val.pricePositionPct}
              pricePositionLabel={val.pricePositionLabel as PricePositionLabel}
            />
          )}

          <div className="card p-6">
            <h3 className="font-display text-sm font-bold text-charcoal-900">Seller</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-charcoal-100 font-display font-bold text-charcoal-700">
                {listing.seller.image ? (
                  <Image src={listing.seller.image} alt="" fill className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{listing.seller.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1 font-medium text-charcoal-900">
                  {listing.seller.name}
                  {listing.seller.verificationLevel !== "BASIC" && <BadgeCheck className="h-4 w-4 text-green-600" />}
                </p>
                <p className="text-xs text-charcoal-500">Member for {Math.max(1, Math.floor(accountAgeDays / 30))} month(s)</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">Verification</span>
                <span className="font-medium text-charcoal-900">
                  {listing.seller.verificationLevel === "TRUSTED" ? "Trusted Seller ✓" : listing.seller.verificationLevel === "VERIFIED" ? "Verified User ✓" : "Basic (email only)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">Rating</span>
                <span className="flex items-center gap-1 font-medium text-charcoal-900">
                  {avgRating ? (
                    <>
                      <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-600" /> {avgRating.toFixed(1)} ({listing.seller.reviewsReceived.length})
                    </>
                  ) : (
                    "No reviews yet"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">Completed sales</span>
                <span className="font-medium text-charcoal-900">{listing.seller.transactionsAsSeller.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-charcoal-50 p-4 text-xs text-charcoal-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-charcoal-400" />
            <p>{`BikeFair facilitates this connection but is not a party to the transaction. Inspect the bike in person and exchange payment directly with the seller.`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
