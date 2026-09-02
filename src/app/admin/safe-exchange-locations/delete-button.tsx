"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteSafeExchangeLocationAction } from "@/server/actions/admin";

export function DeleteLocationButton({ locationId, name }: { locationId: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Remove ${name} as a safe exchange location? This can't be undone.`)) return;
        startTransition(async () => {
          await deleteSafeExchangeLocationAction(locationId);
          router.refresh();
        });
      }}
    >
      Delete
    </Button>
  );
}
