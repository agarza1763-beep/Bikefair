"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await requestPasswordResetAction(email);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  }

  if (sent) {
    return (
      <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
        If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send Reset Link"}
      </Button>
    </form>
  );
}
