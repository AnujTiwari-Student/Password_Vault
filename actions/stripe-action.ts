"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/db";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe-client";

interface CreateCheckoutSessionParams {
  planId: "free" | "pro" | "enterprise";
  billingCycle: "monthly" | "yearly";
  vaultId: string;
  vaultType: "personal" | "org";
}

interface CheckoutSessionResult {
  url?: string;
  error?: string;
}

const PRICING = {
  personal: {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 749, yearly: 7490 },
    enterprise: { monthly: 2499, yearly: 24990 },
  },
  org: {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 2099, yearly: 20990 },
    enterprise: { monthly: 8299, yearly: 82990 },
  },
};

export async function createStripeCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in." };
    }

    const { planId, billingCycle, vaultId, vaultType } = params;

    if (planId === "free") {
      return { error: "Cannot create checkout session for free plan" };
    }

    const vaultPricing = vaultType === "org" ? PRICING.org : PRICING.personal;
    const price = vaultPricing[planId][billingCycle];

    if (!price || price === 0) {
      return { error: "Invalid plan or pricing" };
    }

    const amountInPaisa = price * 100;

    const existingCustomers = await stripe.customers.list({
      email: session.user.email as string,
      limit: 1,
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email as string,
        name: session.user.name as string,
        metadata: {
          userId: session.user.id,
          vaultId: vaultId,
        },
      });
      customerId = customer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `${
                vaultType === "org" ? "Organization" : "Personal"
              } Vault - ${
                billingCycle === "yearly" ? "Yearly" : "Monthly"
              } Subscription`,
            },
            unit_amount: amountInPaisa,
            recurring: {
              interval: billingCycle === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        userId: session.user.id,
        vaultId: vaultId,
        vaultType: vaultType,
        planId: planId,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          vaultId: vaultId,
          vaultType: vaultType,
          planId: planId,
        },
      },
    });

    if (!checkoutSession.url) {
      return { error: "Failed to create checkout session" };
    }

    return { url: checkoutSession.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    };
  }
}

export async function verifyCheckoutSession(sessionId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (checkoutSession.metadata?.userId !== session.user.id) {
      return { success: false, error: "Session does not belong to user" };
    }

    return { success: true, session: checkoutSession };
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify checkout session",
    };
  }
}

export async function createStripePortalSession() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in." };
    }

    const customers = await stripe.customers.list({
      email: session.user.email as string,
      limit: 1,
    });

    const customer = customers.data.find(
      (c) => c.metadata?.userId === session.user.id
    );

    if (!customer) {
      return {
        error:
          "No active subscription found. Please upgrade to a paid plan first.",
      };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return { url: portalSession.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create portal session",
    };
  }
}

export async function getSubscriptionDetails() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        plan: "free",
        status: "active",
        error: "Unauthorized",
      };
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: session.user.id,
        status: "active",
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!subscription) {
      return {
        plan: "free",
        status: "active",
      };
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      nextBillingDate: subscription.next_billing_date?.toISOString() || null,
      amount: subscription.amount,
      paymentMethod: subscription.payment_method || "None",
      currency: subscription.currency,
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {
      plan: "free",
      status: "active",
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch subscription details",
    };
  }
}

export async function cancelSubscription() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: session.user.id,
        status: "active",
      },
    });

    if (!subscription) {
      return { success: false, error: "No active subscription found" };
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "cancelled",
        cancelled_at: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription",
    };
  }
}

export async function handleCheckoutCompleted(session: {
  id: string;
  customer: string;
  subscription: string;
  amount_total: number;
  metadata: {
    userId: string;
    vaultId: string;
    vaultType: string;
    planId: string;
    billingCycle: string;
  };
}) {
  try {
    const { userId, vaultId, planId, billingCycle } = session.metadata;
    const amount = session.amount_total / 100;

    const nextBillingDate = new Date();
    if (billingCycle === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    await prisma.subscription.create({
      data: {
        vault_id: vaultId,
        user_id: userId,
        plan: planId,
        status: "active",
        billing_cycle: billingCycle,
        amount: amount,
        currency: "inr",
        next_billing_date: nextBillingDate,
        last_payment_date: new Date(),
        payment_method: "Stripe",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Checkout completed handler error:", error);
    throw error;
  }
}

export async function handleSubscriptionUpdated(subscription: {
  id: string;
  customer: string;
  status: string;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
      };
    }>;
  };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  metadata: {
    userId?: string;
    vaultId?: string;
    planId?: string;
  };
}) {
  try {
    const { vaultId, planId } = subscription.metadata;

    if (!vaultId) {
      throw new Error("Vault ID not found in subscription metadata");
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { vault_id: vaultId },
    });

    if (!existingSubscription) {
      throw new Error("Subscription not found");
    }

    const amount = subscription.items.data[0]?.price.unit_amount / 100 || 0;
    const nextBillingDate = new Date(subscription.current_period_end * 1000);

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan: planId || existingSubscription.plan,
        status: subscription.status === "active" ? "active" : "cancelled",
        amount: amount,
        next_billing_date: nextBillingDate,
        last_payment_date: new Date(subscription.current_period_start * 1000),
        cancelled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        will_downgrade_at: subscription.cancel_at_period_end
          ? nextBillingDate
          : null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Subscription updated handler error:", error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(subscription: {
  id: string;
  customer: string;
  metadata: {
    userId?: string;
    vaultId?: string;
  };
}) {
  try {
    const { vaultId } = subscription.metadata;

    if (!vaultId) {
      throw new Error("Vault ID not found in subscription metadata");
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { vault_id: vaultId },
    });

    if (!existingSubscription) {
      throw new Error("Subscription not found");
    }

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "cancelled",
        cancelled_at: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Subscription deleted handler error:", error);
    throw error;
  }
}

export async function handleInvoicePaid(invoice: {
  id: string;
  customer: string;
  subscription: string;
  amount_paid: number;
  billing_reason: string;
}) {
  try {
    const { customer, amount_paid, billing_reason } = invoice;

    const subscription = await prisma.subscription.findFirst({
      where: {
        user: {
          accounts: {
            some: {
              providerAccountId: customer,
            },
          },
        },
        status: "active",
      },
    });

    if (!subscription) {
      console.log("No subscription found for invoice payment");
      return { success: true };
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        last_payment_date: new Date(),
        amount: amount_paid / 100,
      },
    });

    if (billing_reason === "subscription_cycle") {
      const nextBillingDate = new Date(
        subscription.next_billing_date || new Date()
      );
      if (subscription.billing_cycle === "yearly") {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          next_billing_date: nextBillingDate,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Invoice paid handler error:", error);
    throw error;
  }
}

export async function handleInvoicePaymentFailed(invoice: {
  id: string;
  customer: string;
  subscription: string;
  amount_due: number;
  last_payment_error?: {
    message: string;
  };
}) {
  try {
    const { customer, amount_due, last_payment_error } = invoice;

    const subscription = await prisma.subscription.findFirst({
      where: {
        user: {
          accounts: {
            some: {
              providerAccountId: customer,
            },
          },
        },
        status: "active",
      },
    });

    if (!subscription) {
      console.log("No subscription found for failed payment");
      return { success: true };
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "suspended",
      },
    });

    console.log(
      `Payment failed for subscription ${subscription.id}. Amount due: ${
        amount_due / 100
      }. Error: ${last_payment_error?.message || "Unknown"}`
    );

    return { success: true };
  } catch (error) {
    console.error("Invoice payment failed handler error:", error);
    throw error;
  }
}

export async function handleChargeRefunded(charge: {
  id: string;
  customer: string;
  amount_refunded: number;
  refunds: {
    data: Array<{
      reason: string | null;
    }>;
  };
}) {
  try {
    const { customer, amount_refunded, refunds } = charge;
    const refundReason = refunds.data[0]?.reason || "no_reason_provided";

    const subscription = await prisma.subscription.findFirst({
      where: {
        user: {
          accounts: {
            some: {
              providerAccountId: customer,
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (subscription) {
      console.log(
        `Refund processed for user ${subscription.user_id}. Amount: ${
          amount_refunded / 100
        } INR. Reason: ${refundReason}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Charge refunded handler error:", error);
    throw error;
  }
}
