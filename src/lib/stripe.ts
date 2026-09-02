import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/** Central accessor so the key is only read/validated once per warm instance. */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    stripeInstance = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
