import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { VerifyPhoneButton } from "./verify-phone-button";

export const metadata = { title: "My Account — BikeFair" };

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: { verifications: true, listings: { where: { status: "ACTIVE" } }, reviewsReceived: true },
  });

  const emailVerified = !!user.emailVerified;
  const phoneVerified = user.phoneVerified;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal-900 font-display text-2xl font-bold text-white">{user.name.charAt(0)}</div>
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-charcoal-900">
            {user.name}
            {user.verificationLevel !== "BASIC" && <BadgeCheck className="h-5 w-5 text-green-600" />}
          </h1>
          <p className="text-sm text-charcoal-500">
            {user.city}, {user.state} · Member since {user.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/account/listings" className="card p-5 hover:border-green-600">
          <p className="font-display text-2xl font-bold text-charcoal-900">{user.listings.length}</p>
          <p className="text-sm text-charcoal-500">Active listings</p>
        </Link>
        <Link href="/account/transactions" className="card p-5 hover:border-green-600">
          <p className="font-display text-2xl font-bold text-charcoal-900">View</p>
          <p className="text-sm text-charcoal-500">Transaction history</p>
        </Link>
        <Link href="/account/reviews" className="card p-5 hover:border-green-600">
          <p className="font-display text-2xl font-bold text-charcoal-900">{user.reviewsReceived.length}</p>
          <p className="text-sm text-charcoal-500">Reviews received</p>
        </Link>
      </div>

      <div className="mt-8 card p-6">
        <h2 className="font-display text-lg font-bold text-charcoal-900">Verification</h2>
        <p className="mt-1 text-sm text-charcoal-500">
          Current level: <strong>{user.verificationLevel}</strong>
          {user.isTrustedSeller && " — Trusted Seller ✓"}
        </p>
        <div className="mt-4 space-y-3">
          <VerificationRow label="Email" verified={emailVerified} hint={emailVerified ? undefined : "Check your inbox (or server console in dev) for a verification link."} />
          <VerificationRow label="Phone" verified={phoneVerified} action={!phoneVerified ? <VerifyPhoneButton /> : undefined} />
          <VerificationRow label="Identity" verified={false} hint="Identity verification via a third-party provider is not yet enabled in this MVP." disabled />
        </div>
      </div>

      <div className="mt-8 card p-6 text-xs text-charcoal-400">
        <p>
          BikeFair never claims a verification has occurred unless it actually has. "Verified User" requires confirmed email and phone. "Trusted Seller" additionally
          requires a track record of completed transactions, strong ratings, and no unresolved reports.
        </p>
      </div>
    </div>
  );
}

function VerificationRow({ label, verified, hint, action, disabled }: { label: string; verified: boolean; hint?: string; action?: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal-100 pb-3 last:border-0 last:pb-0">
      <div>
        <p className={`text-sm font-medium ${disabled ? "text-charcoal-400" : "text-charcoal-900"}`}>{label}</p>
        {hint && <p className="text-xs text-charcoal-400">{hint}</p>}
      </div>
      {verified ? <span className="text-sm font-medium text-green-700">Verified ✓</span> : action}
    </div>
  );
}
