"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateSerialReviewAction } from "@/server/actions/admin";
import { SERIAL_STATUSES, SERIAL_STATUS_LABELS, type SerialStatus } from "@/lib/constants";

const REVIEWABLE_STATUSES = SERIAL_STATUSES.filter((s) => s !== "NOT_SUBMITTED") as Exclude<SerialStatus, "NOT_SUBMITTED">[];

export function SerialRowActions({ serialReviewId, currentStatus, currentNotes }: { serialReviewId: string; currentStatus: string; currentNotes: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Exclude<SerialStatus, "NOT_SUBMITTED">>(currentStatus as Exclude<SerialStatus, "NOT_SUBMITTED">);
  const [notes, setNotes] = useState(currentNotes);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value as Exclude<SerialStatus, "NOT_SUBMITTED">)}>
        {REVIEWABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SERIAL_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <input className="input max-w-xs" placeholder="Review notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await updateSerialReviewAction(serialReviewId, status, notes);
            router.refresh();
          })
        }
      >
        Save
      </Button>
    </div>
  );
}
