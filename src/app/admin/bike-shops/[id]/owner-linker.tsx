"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { linkBikeShopOwnerAction } from "@/server/actions/admin";

export function OwnerLinker({
  bikeShopId,
  currentOwnerId,
  users,
}: {
  bikeShopId: string;
  currentOwnerId: string | null;
  users: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentOwnerId ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <select className="input max-w-xs" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">No linked owner</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await linkBikeShopOwnerAction(bikeShopId, selected || null);
            router.refresh();
          })
        }
      >
        Save
      </Button>
    </div>
  );
}
