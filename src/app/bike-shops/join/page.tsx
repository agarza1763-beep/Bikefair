import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getFee } from "@/lib/fees";
import { isStripeConfigured } from "@/lib/stripe";
import { formatCents } from "@/lib/constants";
import { LinkButton } from "@/components/ui/button";
import { JoinForm } from "./join-form";
import { MembershipCheckoutButtons } from "./membership-checkout-buttons";

export const metadata = {
  title: "Become a Partner Shop",
  description: "List your bike shop as a trusted BikeFair meetup location and get a partner-only Local Market Pulse dashboard for your city.",
};

const BENEFITS = [
  "Listed on the BikeFair Bike Shops directory for cyclists searching in your area",
  "Available as a designated safe meetup location for local buyers and sellers",
  "New foot traffic from cyclists you haven't met yet — a reason for them to walk into your shop",
  "Optional: offer a paid professional inspection/tune-up service to buyers meeting at your shop",
  "Local Market Pulse dashboard, customized to what you actually sell — track specific categories and brands, see which ones are undersupplied in your area (an Opportunities feed for what to stock or seek trade-ins for), and follow month-over-month listing/sales momentum — all built from real BikeFair activity you can't get anywhere public",
];

export default async function JoinBikeShopPage() {
  const user = await currentUser();
  const fee = await getFee("BIKE_SHOP_MEMBERSHIP");
  const yearlyFee = await getFee("BIKE_SHOP_MEMBERSHIP_YEARLY");
  const stripeReady = isStripeConfigured();

  const existingShop = user ? await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id } }) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">Become a BikeFair Partner Shop</h1>
      <p className="mt-3 text-charcoal-600">
        {fee.isActive ? formatCents(fee.amountCents) : "$25"}/month, cancel anytime — for as long as you want to stay associated. This helps bring new clients and
        cyclists into your location more often, and positions your shop as a trustworthy, community-safe location for local bicycle transactions.
      </p>

      <ul className="mt-6 space-y-2.5">
        {BENEFITS.map((b) => (
          <li key={b} className="flex gap-2.5 text-sm text-charcoal-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-charcoal-100 bg-white p-6">
        {!user ? (
          <div className="text-center">
            <p className="text-sm text-charcoal-600">Sign in or create a BikeFair account first — your shop will be linked to it.</p>
            <div className="mt-4 flex justify-center gap-3">
              <LinkButton href="/auth/sign-in?callbackUrl=/bike-shops/join" variant="primary">
                Sign In
              </LinkButton>
              <LinkButton href="/auth/sign-up" variant="outline">
                Create Account
              </LinkButton>
            </div>
          </div>
        ) : existingShop ? (
          <div className="text-center">
            <p className="font-display text-lg font-bold text-charcoal-900">{existingShop.name}</p>

            {existingShop.membershipStatus === "PENDING" && stripeReady && (
              <>
                <p className="mt-2 text-sm text-charcoal-600">Choose a plan to activate your listing — billing starts immediately and you can cancel anytime.</p>
                <MembershipCheckoutButtons bikeShopId={existingShop.id} monthlyCents={fee.isActive ? fee.amountCents : 2500} yearlyCents={yearlyFee.isActive ? yearlyFee.amountCents : 25000} />
              </>
            )}
            {existingShop.membershipStatus === "PENDING" && !stripeReady && (
              <p className="mt-2 text-sm text-charcoal-600">Your signup is in review. We'll follow up to confirm billing and activate your listing.</p>
            )}
            {existingShop.membershipStatus === "ACTIVE" && (
              <p className="mt-2 text-sm text-charcoal-600">
                Your shop is an active partner location{existingShop.membershipInterval ? ` (billed ${existingShop.membershipInterval === "YEAR" ? "yearly" : "monthly"})` : ""}.
              </p>
            )}
            {existingShop.membershipStatus === "CANCELLED" && <p className="mt-2 text-sm text-charcoal-600">Your membership was cancelled. Contact us if you'd like to rejoin.</p>}

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <LinkButton href={`/bike-shops/${existingShop.id}`} variant="outline">
                View Shop Page
              </LinkButton>
              {existingShop.membershipStatus === "ACTIVE" && (
                <LinkButton href="/account/shop-dashboard" variant="primary">
                  Open Shop Dashboard
                </LinkButton>
              )}
            </div>
          </div>
        ) : (
          <JoinForm feeCents={fee.isActive ? fee.amountCents : 2500} />
        )}
      </div>

      <p className="mt-6 text-xs text-charcoal-400">
        {stripeReady
          ? "Billing is handled securely through Stripe. You'll choose Monthly or Yearly and pay directly after your shop details are submitted."
          : "Submitting this form does not charge a real card yet — a signup request is sent for review, and our team follows up to arrange billing and confirm your listing goes live."}{" "}
        See our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        for details.
      </p>
    </div>
  );
}
