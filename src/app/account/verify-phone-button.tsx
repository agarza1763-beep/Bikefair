"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { verifyPhoneDemoAction } from "@/server/actions/auth";

export function VerifyPhoneButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Verify Phone (Demo)
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input className="input w-40" placeholder="(555) 555-5555" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button
        size="sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await verifyPhoneDemoAction(phone);
          setLoading(false);
          router.refresh();
        }}
      >
        Confirm
      </Button>
    </div>
  );
}
