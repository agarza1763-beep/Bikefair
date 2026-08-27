"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateFeeAction } from "@/server/actions/admin";
import type { FeeType } from "@/lib/constants";

export function FeeRow({ fee }: { fee: { type: string; name: string; amountCents: number; isPercentage: boolean; isActive: boolean; description: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(fee.amountCents));
  const [isPercentage, setIsPercentage] = useState(fee.isPercentage);
  const [isActive, setIsActive] = useState(fee.isActive);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div>
        <p className="text-sm font-medium text-charcoal-900">{fee.name}</p>
        <p className="text-xs text-charcoal-400">{fee.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input className="input w-24" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label className="flex items-center gap-1 text-xs text-charcoal-500">
          <input type="checkbox" checked={isPercentage} onChange={(e) => setIsPercentage(e.target.checked)} /> %
        </label>
        <label className="flex items-center gap-1 text-xs text-charcoal-500">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateFeeAction(fee.type as FeeType, Number(amount), isPercentage, isActive);
              router.refresh();
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}
