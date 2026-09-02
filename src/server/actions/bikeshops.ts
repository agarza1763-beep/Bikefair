"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { geocode } from "@/lib/geo";
import { bikeShopSchema } from "@/lib/validation";
import { getFee } from "@/lib/fees";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { BRAND_NAME } from "@/lib/constants";
import type { ActionResult } from "./auth";

/**
 * Public self-serve shop signup (see /bike-shops/join). Creates the shop as PENDING — it does not
 * appear on the public directory or as a selectable meetup location until an admin reviews and
 * approves it (see approveBikeShopMembershipAction in admin.ts). No payment is actually collected
 * here — see the disclaimer on the join page and the README for why.
 */
export async function submitBikeShopSignupAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = bikeShopSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid shop details." };
  const data = parsed.data;

  const existing = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id } });
  if (existing) return { ok: false, error: "You already have a bike shop associated with your account." };

  const point = await geocode(data.city, data.state);

  const shop = await prisma.bikeShop.create({
    data: {
      ownerUserId: user.id,
      name: data.name,
      description: data.description || null,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip || null,
      lat: point.lat,
      lng: point.lng,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      offersInspection: !!data.offersInspection,
      inspectionFeeCents: data.offersInspection && data.inspectionFee ? Math.round(data.inspectionFee * 100) : null,
      isVerified: false,
      isDemo: false,
      membershipStatus: "PENDING",
    },
  });

  revalidatePath("/admin/bike-shops");
  return { ok: true, data: { id: shop.id } };
}

/**
 * Creates a Stripe Checkout session for the shop's own owner to pay the recurring partner
 * membership fee — monthly or a discounted yearly rate. Activation happens automatically via
 * the Stripe webhook once payment succeeds (see /api/stripe/webhook), not here.
 */
export async function startBikeShopMembershipCheckoutAction(bikeShopId: string, interval: "MONTH" | "YEAR"): Promise<ActionResult<{ url: string }>> {
  if (!isStripeConfigured()) return { ok: false, error: "Payments aren't configured yet — check back soon." };

  const user = await requireUser();
  const shop = await prisma.bikeShop.findUnique({ where: { id: bikeShopId } });
  if (!shop || shop.ownerUserId !== user.id) return { ok: false, error: "Not authorized." };
  if (shop.membershipStatus === "ACTIVE") return { ok: false, error: "This shop's membership is already active." };

  const feeType = interval === "YEAR" ? "BIKE_SHOP_MEMBERSHIP_YEARLY" : "BIKE_SHOP_MEMBERSHIP";
  const fee = await getFee(feeType);
  const stripe = getStripe();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  let customerId = shop.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined, name: shop.name, metadata: { bikeShopId } });
    customerId = customer.id;
    await prisma.bikeShop.update({ where: { id: bikeShopId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: fee.amountCents,
          recurring: { interval: interval === "YEAR" ? "year" : "month" },
          product_data: { name: `${BRAND_NAME} Bike Shop Partner Membership (${interval === "YEAR" ? "Yearly" : "Monthly"})` },
        },
      },
    ],
    metadata: { bikeShopId, interval },
    subscription_data: { metadata: { bikeShopId, interval } },
    success_url: `${baseUrl}/bike-shops/join?checkout=success`,
    cancel_url: `${baseUrl}/bike-shops/join?checkout=cancelled`,
  });

  if (!session.url) return { ok: false, error: "Could not start checkout. Please try again." };
  return { ok: true, data: { url: session.url } };
}
