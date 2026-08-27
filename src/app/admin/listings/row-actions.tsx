"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminRemoveListingAction, toggleFeaturedAction } from "@/server/actions/admin";

export function ListingAdminRowActions({ listingId, isFeatured, removed }: { listingId: string; isFeatured: boolean; removed: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleFeaturedAction(listingId, !isFeatured);
            router.refresh();
          })
        }
      >
        {isFeatured ? "Unfeature" : "Feature"}
      </Button>
      {!removed && (
        <Button
          size="sm"
          variant="danger"
          disabled={isPending}
          onClick={() => {
            if (confirm("Remove this listing?")) {
              startTransition(async () => {
                await adminRemoveListingAction(listingId);
                router.refresh();
              });
            }
          }}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
