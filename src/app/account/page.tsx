import Link from "next/link";
import { BadgeCheck, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { VerifyPhoneButton } from "./verify-phone-button";
import { ProfilePhotoUploader } from "@/components/account/profile-photo-uploader";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: { verifications: true, listings: { where: { status: "ACTIVE" } }, reviewsReceived: true },
  });
  const ownedShop = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id }, select: { name: true, membershipStatus: true } });

  const emailVerified = !!user.emailVerified;
  const phoneVerified = user.phoneVerified;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <ProfilePhotoUploader currentImage={user.image} name={user.name} />
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

      {!user.image && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Add a profile photo above — it's required before you can create a listing or message another user, so buyers and sellers know who they're dealing with.
        </p>
      )}

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

      {ownedShop && (
        <Link
          href="/account/shop-dashboard"
          className="mt-4 flex items-center gap-4 rounded-2xl border-2 border-dashed border-green-600 bg-green-50 p-5 transition-colors hover:bg-green-100"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
            <TrendingUp className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-display text-base font-bold text-green-900">{ownedShop.name}'s Shop Dashboard</p>
            <p className="text-sm text-green-800">
              {ownedShop.membershipStatus === "ACTIVE" ? "Local Market Pulse — partner-only trends for your city" : "Membership inactive — reactivate to unlock partner tools"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white">View →</span>
        </Link>
      )}

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
