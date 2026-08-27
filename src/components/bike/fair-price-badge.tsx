import clsx from "clsx";
import { PRICE_POSITION_LABELS, type PricePositionLabel } from "@/lib/constants";

const STYLES: Record<PricePositionLabel, string> = {
  FAIR: "bg-green-100 text-green-800",
  SLIGHTLY_ABOVE: "bg-amber-100 text-amber-700",
  SLIGHTLY_BELOW: "bg-amber-100 text-amber-700",
  SIGNIFICANTLY_ABOVE: "bg-red-100 text-red-600",
  SIGNIFICANTLY_BELOW: "bg-red-100 text-red-600",
};

const DOTS: Record<PricePositionLabel, string> = {
  FAIR: "bg-green-600",
  SLIGHTLY_ABOVE: "bg-amber-500",
  SLIGHTLY_BELOW: "bg-amber-500",
  SIGNIFICANTLY_ABOVE: "bg-red-500",
  SIGNIFICANTLY_BELOW: "bg-red-500",
};

export function FairPriceBadge({ label, className }: { label: PricePositionLabel; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", STYLES[label], className)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOTS[label])} />
      {PRICE_POSITION_LABELS[label]}
    </span>
  );
}
