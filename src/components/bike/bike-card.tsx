import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { BIKE_CATEGORY_LABELS, formatCents, type BikeCategory, type PricePositionLabel } from "@/lib/constants";
import { FairPriceBadge } from "./fair-price-badge";
import { UnrecognizedBrandBadge } from "./unrecognized-brand-badge";

export interface BikeCardData {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  category: BikeCategory;
  frameSize: string;
  askingPrice: number;
  city: string;
  state: string;
  imageUrl?: string | null;
  sellerName: string;
  sellerImage?: string | null;
  sellerVerificationLevel: string;
  estimatedLowCents?: number | null;
  estimatedHighCents?: number | null;
  pricePositionLabel?: PricePositionLabel | null;
  isRecognizedBrand?: boolean;
  isShopInventory?: boolean;
}

export function BikeCard({ bike }: { bike: BikeCardData }) {
  return (
    <Link
      href={`/bike/${bike.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white transition-shadow hover:shadow-lg hover:shadow-charcoal-900/5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal-50">
        {bike.imageUrl ? (
          <Image
            src={bike.imageUrl}
            alt={bike.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-charcoal-300">No photo</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-charcoal-900/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {BIKE_CATEGORY_LABELS[bike.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold leading-snug text-charcoal-900">
            {bike.year} {bike.brand} {bike.model}
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-extrabold text-charcoal-900">{formatCents(bike.askingPrice)}</span>
        </div>

        {bike.isShopInventory ? (
          <p className="text-xs font-medium uppercase tracking-wide text-green-700">New shop inventory</p>
        ) : (
          bike.estimatedLowCents != null &&
          bike.estimatedHighCents != null && (
            <p className="text-xs text-charcoal-500">
              Estimated Fair Value: {formatCents(bike.estimatedLowCents)}–{formatCents(bike.estimatedHighCents)}
            </p>
          )
        )}

        <div className="flex flex-wrap gap-1.5">
          {!bike.isShopInventory && bike.pricePositionLabel && <FairPriceBadge label={bike.pricePositionLabel} className="w-fit" />}
          {bike.isRecognizedBrand === false && <UnrecognizedBrandBadge isEbike={bike.category === "EBIKE"} compact />}
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-charcoal-100 pt-2.5 text-xs text-charcoal-500">
          <span>
            {bike.frameSize} · {bike.city}, {bike.state}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-charcoal-700">
          <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-charcoal-900">
            {bike.sellerImage ? (
              <Image src={bike.sellerImage} alt="" fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">{bike.sellerName.charAt(0)}</span>
            )}
          </span>
          {bike.sellerVerificationLevel !== "BASIC" && <BadgeCheck className="h-3.5 w-3.5 text-green-600" />}
          <span>{bike.sellerName}</span>
          {bike.sellerVerificationLevel !== "BASIC" && <span className="text-green-700">Verified</span>}
        </div>
      </div>
    </Link>
  );
}
