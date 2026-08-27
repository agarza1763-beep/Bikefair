"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addRecognizedBrandAction } from "@/server/actions/admin";

export function AddBrandForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addRecognizedBrandAction(name, notes);
      if (!res.ok) return setError(res.error);
      setName("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="label">Brand name</span>
        <input className="input" placeholder="e.g. Ariel Rider" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Notes (optional)</span>
        <input className="input" placeholder="e.g. UL 2849 certified" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button disabled={isPending || !name.trim()} onClick={submit}>
        Add Brand
      </Button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </div>
  );
}
