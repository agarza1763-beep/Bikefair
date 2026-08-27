"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removeRecognizedBrandAction, toggleRecognizedBrandAction } from "@/server/actions/admin";

export function BrandRow({ brand }: { brand: { id: string; name: string; notes: string; isActive: boolean } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-charcoal-50 last:border-0">
      <td className="px-4 py-3 font-medium text-charcoal-900">{brand.name}</td>
      <td className="px-4 py-3 text-charcoal-500">{brand.notes || "—"}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${brand.isActive ? "bg-green-100 text-green-700" : "bg-charcoal-100 text-charcoal-500"}`}>
          {brand.isActive ? "Recognized" : "Deactivated"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await toggleRecognizedBrandAction(brand.id, !brand.isActive);
                router.refresh();
              })
            }
          >
            {brand.isActive ? "Deactivate" : "Reactivate"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Permanently remove "${brand.name}" from the list?`)) {
                startTransition(async () => {
                  await removeRecognizedBrandAction(brand.id);
                  router.refresh();
                });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
