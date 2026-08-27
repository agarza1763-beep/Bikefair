import { TriangleAlert } from "lucide-react";

/** Shown on any listing whose brand isn't on the admin-maintained recognized-brand allowlist. */
export function UnrecognizedBrandBadge({ isEbike, compact = false }: { isEbike: boolean; compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <TriangleAlert className="h-3 w-3" />
        Unrecognized brand
      </span>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl bg-amber-100 p-3 text-xs text-amber-800">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>Unrecognized brand.</strong>{" "}
        {isEbike
          ? "This brand isn't on our list of established e-bike manufacturers. Generic or drop-shipped e-bikes can carry real battery fire and build-quality risks — ask the seller about battery certification (look for UL 2271 or UL 2849) before buying, and inspect the bike in person."
          : "This brand isn't on our list of established bicycle manufacturers. Inspect the bike carefully in person before buying."}
      </p>
    </div>
  );
}
