"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveBikeShopMembershipAction, cancelBikeShopMembershipAction } from "@/server/actions/admin";

export function MembershipActions({ bikeShopId, membershipStatus, hasOwner }: { bikeShopId: string; membershipStatus: string; hasOwner: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (membershipStatus === "PENDING") {
    return (
      <Button
        size="sm"
        disabled={isPending || !hasOwner}
        title={hasOwner ? undefined : "No linked owner account to bill"}
        onClick={() =>
          startTransition(async () => {
            await approveBikeShopMembershipAction(bikeShopId);
            router.refresh();
          })
        }
      >
        Approve Membership
      </Button>
    );
  }

  if (membershipStatus === "ACTIVE") {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          if (confirm("Cancel this shop's membership? It will no longer appear on the public directory.")) {
            startTransition(async () => {
              await cancelBikeShopMembershipAction(bikeShopId);
              router.refresh();
            });
          }
        }}
      >
        Cancel Membership
      </Button>
    );
  }

  return null;
}
