"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/button";
import { markListingSoldAction, removeListingAction } from "@/server/actions/listings";

export function ListingRowActions({ listingId, status }: { listingId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 gap-2">
      {status !== "REMOVED" && (
        <LinkButton size="sm" variant="outline" href={`/account/listings/${listingId}/edit`}>
          Edit
        </LinkButton>
      )}
      {status === "ACTIVE" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(async () => { await markListingSoldAction(listingId); router.refresh(); })}
        >
          Mark Sold
        </Button>
      )}
      {status !== "REMOVED" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (confirm("Remove this listing?")) startTransition(async () => { await removeListingAction(listingId); router.refresh(); });
          }}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
