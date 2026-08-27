"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { suspendUserAction } from "@/server/actions/admin";

export function SuspendButton({ userId, suspended, disabled }: { userId: string; suspended: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (disabled) return null;

  return (
    <Button
      size="sm"
      variant={suspended ? "outline" : "danger"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await suspendUserAction(userId, !suspended);
          router.refresh();
        })
      }
    >
      {suspended ? "Reinstate" : "Suspend"}
    </Button>
  );
}
