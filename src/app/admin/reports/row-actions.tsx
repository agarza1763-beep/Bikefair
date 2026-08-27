"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resolveReportAction } from "@/server/actions/admin";

export function ReportRowActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function act(status: "RESOLVED" | "DISMISSED" | "IN_REVIEW") {
    startTransition(async () => {
      await resolveReportAction(reportId, status, notes);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input className="input max-w-xs" placeholder="Admin notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => act("IN_REVIEW")}>
        Mark In Review
      </Button>
      <Button size="sm" disabled={isPending} onClick={() => act("RESOLVED")}>
        Resolve
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={() => act("DISMISSED")}>
        Dismiss
      </Button>
    </div>
  );
}
