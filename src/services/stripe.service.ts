import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.StripeConfig["apiVersion"] = "2026-02-25.clover";

let client: Stripe | null = null;

function assertStripeEnv() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
}

export function getStripeClient() {
  assertStripeEnv();
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: STRIPE_API_VERSION,
    });
  }
  return client;
}

export function getStripePriceId(plan: "PRO" | "BUSINESS") {
  if (plan === "PRO") {
    if (!process.env.STRIPE_PRO_PRICE_ID) {
      throw new Error("Missing STRIPE_PRO_PRICE_ID");
    }
    return process.env.STRIPE_PRO_PRICE_ID;
  }

  if (!process.env.STRIPE_BUSINESS_PRICE_ID) {
    throw new Error("Missing STRIPE_BUSINESS_PRICE_ID");
  }
  return process.env.STRIPE_BUSINESS_PRICE_ID;
}
