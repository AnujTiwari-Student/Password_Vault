import Razorpay from "razorpay";

export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay environment variables are not set");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export const RAZORPAY_CONFIG = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  currency: "inr",
  successUrl: `${process.env.NEXTAUTH_URL}/billing/success`,
  cancelUrl: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
} as const;

export const PLAN_PRICES = {
  personal: {
    pro: {
      monthly: 299,
      yearly: 2999,
    },
    enterprise: {
      monthly: 599,
      yearly: 5999,
    },
  },
  org: {
    pro: {
      monthly: 499,
      yearly: 4999,
    },
    enterprise: {
      monthly: 999,
      yearly: 9999,
    },
  },
} satisfies {
  personal: {
    pro: Record<"monthly" | "yearly", number>;
    enterprise: Record<"monthly" | "yearly", number>;
  };
  org: {
    pro: Record<"monthly" | "yearly", number>;
    enterprise: Record<"monthly" | "yearly", number>;
  };
};

