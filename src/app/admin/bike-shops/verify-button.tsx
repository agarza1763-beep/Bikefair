"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { verifyBikeShopAction } from "@/server/actions/admin";

export function VerifyShopButton({ bikeShopId, verified }: { bikeShopId: string; verified: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={verified ? "outline" : "secondary"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await verifyBikeShopAction(bikeShopId, !verified);
          router.refresh();
        })
      }
    >
      {verified ? "Unverify" : "Verify"}
    </Button>
  );
}
