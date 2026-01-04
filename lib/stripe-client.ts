import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const STRIPE_CONFIG = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  currency: "inr",
  successUrl: `${process.env.NEXTAUTH_URL}/billing/success`,
  cancelUrl: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
} as const;

export function validateStripeConfig() {
  const missingVars = [];
  if (!process.env.STRIPE_SECRET_KEY) missingVars.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    missingVars.push("STRIPE_WEBHOOK_SECRET");
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    missingVars.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!process.env.NEXTAUTH_URL) missingVars.push("NEXTAUTH_URL");

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missingVars.join(", ")}`
    );
  }
  return true;
}
