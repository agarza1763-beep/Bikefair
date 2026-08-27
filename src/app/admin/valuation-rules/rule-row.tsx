"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { upsertValuationRuleAction } from "@/server/actions/admin";

export function RuleRow({ rule }: { rule: { key: string; label: string; value: number; valueType: string; isActive: boolean } }) {
  const router = useRouter();
  const [value, setValue] = useState(String(rule.value));
  const [active, setActive] = useState(rule.isActive);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-charcoal-900">{rule.label}</p>
        <p className="font-mono text-xs text-charcoal-400">
          {rule.key} · {rule.valueType}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input className="input w-28" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
        <label className="flex items-center gap-1 text-xs text-charcoal-500">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await upsertValuationRuleAction(rule.key, Number(value), active);
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
