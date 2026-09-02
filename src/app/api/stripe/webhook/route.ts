import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getFee } from "@/lib/fees";

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bikeShopId = session.metadata?.bikeShopId;
      const interval = session.metadata?.interval as "MONTH" | "YEAR" | undefined;
      if (!bikeShopId) break;

      const shop = await prisma.bikeShop.findUnique({ where: { id: bikeShopId } });
      if (!shop || !shop.ownerUserId) break;

      const feeType = interval === "YEAR" ? "BIKE_SHOP_MEMBERSHIP_YEARLY" : "BIKE_SHOP_MEMBERSHIP";
      const fee = await getFee(feeType);

      await prisma.$transaction([
        prisma.bikeShop.update({
          where: { id: bikeShopId },
          data: {
            membershipStatus: "ACTIVE",
            isVerified: true,
            membershipApprovedAt: new Date(),
            membershipInterval: interval ?? "MONTH",
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null),
          },
        }),
        prisma.paymentRecord.create({
          data: {
            userId: shop.ownerUserId,
            bikeShopId,
            feeType,
            amountCents: fee.amountCents,
            status: "SUCCEEDED",
            provider: "stripe",
            providerRef: session.id,
          },
        }),
      ]);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const bikeShopId = subscription.metadata?.bikeShopId;
      if (!bikeShopId) break;
      await prisma.bikeShop.update({ where: { id: bikeShopId }, data: { membershipStatus: "CANCELLED" } });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
