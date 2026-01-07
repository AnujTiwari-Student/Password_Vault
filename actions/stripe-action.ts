"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/db";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe-client";
import Stripe from "stripe";

interface CreateCheckoutSessionParams {
  planId: "free" | "pro" | "enterprise";
  billingCycle: "monthly" | "yearly";
  vaultId: string;
  vaultType: "personal" | "org";
}

interface CheckoutSessionResult {
  url?: string;
  error?: string;
  success?: boolean;
  message?: string;
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

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        status: "active",
      },
    });

    if (existingSubscription?.stripe_subscription_id) {
      return await upgradeExistingSubscription({
        existingSubscription,
        newPlanId: planId,
        newBillingCycle: billingCycle,
        vaultType,
        userId: session.user.id,
      });
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
      console.log(`Using existing Stripe customer: ${customerId}`);
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
      console.log(`Created new Stripe customer: ${customerId}`);
    }

    const priceObj = await stripe.prices.create({
      currency: STRIPE_CONFIG.currency,
      unit_amount: amountInPaisa,
      recurring: {
        interval: billingCycle === "yearly" ? "year" : "month",
      },
      product_data: {
        name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - ${vaultType === "org" ? "Organization" : "Personal"}`,
        metadata: {
          planId: planId,
          vaultType: vaultType,
        },
      },
      metadata: {
        planId: planId,
        vaultType: vaultType,
        billingCycle: billingCycle,
      },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceObj.id,
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

    console.log(`Checkout session created: ${checkoutSession.id}`);
    return { url: checkoutSession.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const err = error as Error;
    return { error: err.message || "Failed to create checkout session" };
  }
}

async function upgradeExistingSubscription(params: {
  existingSubscription: {
    id: string;
    vault_id: string;
    user_id: string;
    plan: string;
    billing_cycle: string;
    stripe_subscription_id: string | null;
  };
  newPlanId: string;
  newBillingCycle: string;
  vaultType: string;
  userId: string;
}): Promise<CheckoutSessionResult> {
  try {
    const {
      existingSubscription,
      newPlanId,
      newBillingCycle,
      vaultType,
      userId,
    } = params;

    if (!existingSubscription.stripe_subscription_id) {
      return {
        error: "Stripe subscription ID not found. Please contact support.",
      };
    }

    const vaultPricing = vaultType === "org" ? PRICING.org : PRICING.personal;
    const newPrice =
      vaultPricing[newPlanId as keyof typeof vaultPricing][
        newBillingCycle as "monthly" | "yearly"
      ];
    const amountInPaisa = newPrice * 100;

    const stripeSubscription = await stripe.subscriptions.retrieve(
      existingSubscription.stripe_subscription_id
    );

    const subscriptionItemId = stripeSubscription.items.data[0].id;

    const priceObject = await stripe.prices.create({
      currency: STRIPE_CONFIG.currency,
      unit_amount: amountInPaisa,
      recurring: {
        interval: newBillingCycle === "yearly" ? "year" : "month",
      },
      product_data: {
        name: `${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} Plan`,
      },
      metadata: {
        planId: newPlanId,
        vaultType: vaultType,
      },
    });

    await stripe.subscriptions.update(stripeSubscription.id, {
      items: [
        {
          id: subscriptionItemId,
          price: priceObject.id,
        },
      ],
      proration_behavior: "create_prorations",
      metadata: {
        userId: userId,
        vaultId: existingSubscription.vault_id,
        vaultType: vaultType,
        planId: newPlanId,
      },
    });

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan: newPlanId,
        billing_cycle: newBillingCycle,
        amount: newPrice,
        price_id: priceObject.id,
      },
    });

    console.log(`Subscription upgraded: ${existingSubscription.id}`);

    return {
      success: true,
      message: `Successfully upgraded to ${newPlanId} plan!`,
    };
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    const err = error as Error;
    return { error: err.message || "Failed to upgrade subscription" };
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

    // Just verify the session, don't process it
    // The webhook will handle creating the subscription record
    return {
      success: true,
      message: "Payment successful! Your subscription is being activated.",
      session: {
        id: checkoutSession.id,
        customer: typeof checkoutSession.customer === 'string' 
          ? checkoutSession.customer 
          : checkoutSession.customer?.id || '',
        subscription: typeof checkoutSession.subscription === 'string'
          ? checkoutSession.subscription
          : (checkoutSession.subscription as Stripe.Subscription)?.id || '',
        amount_total: checkoutSession.amount_total || 0,
        metadata: checkoutSession.metadata || {},
      },
    };
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    const err = error as Error;
    return { success: false, error: err.message || "Failed to verify session" };
  }
}

export async function createStripePortalSession() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in." };
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

    if (!subscription?.stripe_customer_id) {
      return {
        error:
          "No active subscription found. Please upgrade to a paid plan first.",
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: subscription.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return {
        error:
          "No active subscription found in Stripe. Please contact support.",
      };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXTAUTH_URL}/billing`,
    });

    console.log(`Billing portal session created for: ${subscription.stripe_customer_id}`);
    return { url: portalSession.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    const err = error as Error;
    return { error: err.message || "Failed to create portal session" };
  }
}

export async function getSubscriptionDetails(vaultId?: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        plan: "free",
        status: "active",
        error: "Unauthorized",
      };
    }

    let subscription;

    if (vaultId) {
      // For org subscriptions: check by vault_id (any member can access)
      subscription = await prisma.subscription.findFirst({
        where: {
          vault_id: vaultId,
          status: "active",
        },
        orderBy: {
          created_at: "desc",
        },
      });
    } else {
      // For personal subscriptions: check by user_id
      subscription = await prisma.subscription.findFirst({
        where: {
          user_id: session.user.id,
          status: "active",
        },
        orderBy: {
          created_at: "desc",
        },
      });
    }

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
      billingCycle: subscription.billing_cycle,
      cancelAtPeriodEnd: subscription.will_downgrade_at ? true : false,
      subscriptionId: subscription.stripe_subscription_id,
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {
      plan: "free",
      status: "active",
      error: "Failed to fetch subscription details",
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

    if (!subscription?.stripe_subscription_id) {
      return { success: false, error: "No active subscription found" };
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        will_downgrade_at: subscription.next_billing_date,
      },
    });

    console.log(`Subscription marked for cancellation: ${subscription.id}`);

    return {
      success: true,
      message: "Subscription will be cancelled at period end",
    };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    const err = error as Error;
    return { success: false, error: err.message || "Failed to cancel" };
  }
}

type PlanType = 'basic' | 'professional' | 'enterprise';

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

    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : (session.customer as Stripe.Customer).id;
    
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription).id;

    let stripeSubscription: Stripe.Subscription | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    const planTypeMap: Record<string, PlanType> = {
      'pro': 'professional',
      'enterprise': 'enterprise',
      'basic': 'basic'
    };

    const userPlanType = planTypeMap[planId as keyof typeof planTypeMap];
    
    while (retryCount < maxRetries) {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
      if (stripeSubscription.current_period_end && stripeSubscription.current_period_start) {
        break;
      }
      
      console.log(`⏳ Subscription period timestamps not yet available, retrying (${retryCount + 1}/${maxRetries})...`);
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    if (!stripeSubscription) {
      throw new Error('Failed to retrieve Stripe subscription');
    }

    const priceId = stripeSubscription.items.data[0]?.price.id;

    let currentPeriodEnd: Date;
    let currentPeriodStart: Date;

    // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
    if (stripeSubscription.current_period_end && stripeSubscription.current_period_start) {
      // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
      currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
      currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      
      if (isNaN(currentPeriodEnd.getTime()) || isNaN(currentPeriodStart.getTime())) {
        throw new Error('Invalid date values from Stripe subscription');
      }
    } else {
      console.log('⚠️ Using fallback date calculation');
      currentPeriodStart = new Date();
      currentPeriodEnd = new Date();
      
      if (billingCycle === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }
    }

    console.log('💾 Saving subscription:', {
      customerId,
      subscriptionId,
      priceId,
      vaultId,
      userId,
      planId,
      currentPeriodEnd,
      currentPeriodStart,
    });

    const existing = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        user_id: userId,
      },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          plan: planId,
          status: "active",
          billing_cycle: billingCycle,
          amount: amount,
          currency: "inr",
          next_billing_date: currentPeriodEnd,
          current_period_end: currentPeriodEnd,
          current_period_start: currentPeriodStart,
          last_payment_date: currentPeriodStart,
          payment_method: "Stripe Card",
          cancelled_at: null,
          will_downgrade_at: null,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan_type: userPlanType,
        },
      });
      
      console.log(`✅ Updated existing subscription AND user plan_type to ${userPlanType}: ${existing.id}`);
    } else {
      await prisma.subscription.create({
        data: {
          vault_id: vaultId,
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          plan: planId,
          status: "active",
          billing_cycle: billingCycle,
          amount: amount,
          currency: "inr",
          next_billing_date: currentPeriodEnd,
          current_period_end: currentPeriodEnd,
          current_period_start: currentPeriodStart,
          last_payment_date: currentPeriodStart,
          payment_method: "Stripe Card",
        },
      });

      // ✅ NEW: Update USER plan_type for NEW subscription
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan_type: userPlanType,
        },
      });
      
      console.log(`✅ Created new subscription AND set user plan_type to ${userPlanType}: ${vaultId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Checkout completed handler error:", error);
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

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { vault_id: vaultId || "" },
          { stripe_subscription_id: subscription.id },
        ],
      },
    });

    if (!existingSubscription) {
      console.error("❌ Subscription not found in database");
      return { success: false, error: "Subscription not found" };
    }

    const amount = subscription.items.data[0]?.price.unit_amount / 100 || 0;
    const priceId = subscription.items.data[0]?.price.id;
    const nextBillingDate = new Date(subscription.current_period_end * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);

    let newStatus = "active";
    if (subscription.status === "canceled" || subscription.canceled_at) {
      newStatus = "cancelled";
    } else if (subscription.status === "active") {
      newStatus = "active";
    } else {
      newStatus = subscription.status;
    }

    const updateData = {
      plan: planId || existingSubscription.plan,
      price_id: priceId,
      status: newStatus,
      amount: amount,
      next_billing_date: nextBillingDate,
      current_period_end: currentPeriodEnd,
      current_period_start: currentPeriodStart,
      last_payment_date: currentPeriodStart,
      cancelled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      will_downgrade_at: subscription.cancel_at_period_end
        ? nextBillingDate
        : null,
    };

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: updateData,
    });

    console.log(`✅ Subscription updated: ${existingSubscription.id}`);
    console.log(`   Status: ${newStatus}`);
    console.log(`   Plan: ${updateData.plan}`);
    console.log(`   Price ID: ${priceId}`);
    console.log(`   Cancel at period end: ${subscription.cancel_at_period_end}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Subscription updated handler error:", error);
    const err = error as Error;
    return { success: false, error: err.message };
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
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: subscription.id,
      },
    });

    if (!existingSubscription) {
      console.error("❌ Subscription not found in database");
      return { success: false, error: "Subscription not found" };
    }

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "cancelled",
        cancelled_at: new Date(),
      },
    });

    console.log(`✅ Subscription deleted: ${existingSubscription.id}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Subscription deleted handler error:", error);
    const err = error as Error;
    return { success: false, error: err.message };
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
    if (!invoice.subscription) {
      console.log("ℹ️ Invoice not related to subscription, skipping");
      return { success: true };
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: invoice.subscription,
      },
    });

    if (!existingSubscription) {
      console.error("❌ Subscription not found for invoice");
      return { success: false, error: "Subscription not found" };
    }

    const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
    const nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "active",
        last_payment_date: new Date(),
        next_billing_date: nextBillingDate,
        current_period_end: nextBillingDate,
        // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      },
    });

    console.log(`✅ Invoice paid processed for subscription: ${existingSubscription.id}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Invoice paid handler error:", error);
    const err = error as Error;
    return { success: false, error: err.message };
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
    const { subscription: subscriptionId, amount_due, last_payment_error } =
      invoice;

    if (!subscriptionId) {
      console.log("ℹ️ No subscription ID in failed invoice");
      return { success: true };
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: subscriptionId,
      },
    });

    if (!subscription) {
      console.log("ℹ️ No subscription found for failed payment");
      return { success: true };
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "suspended",
      },
    });

    console.log(
      `⚠️ Payment failed for subscription ${subscription.id}. Amount due: ${
        amount_due / 100
      }. Error: ${last_payment_error?.message || "Unknown"}`
    );

    return { success: true };
  } catch (error) {
    console.error("❌ Invoice payment failed handler error:", error);
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

export async function getInvoices() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in." };
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

    if (!subscription?.stripe_customer_id) {
      return {
        error: "No active subscription found.",
      };
    }

    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 10,
    });

    return {
      success: true,
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        pdf: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url,
        created: new Date(invoice.created * 1000).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    const err = error as Error;
    return { error: err.message || "Failed to fetch invoices" };
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
        stripe_customer_id: customer,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (subscription) {
      console.log(
        `💸 Refund processed for user ${subscription.user_id}. Amount: ${
          amount_refunded / 100
        } INR. Reason: ${refundReason}`
      );

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "cancelled",
          cancelled_at: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Charge refunded handler error:", error);
    const err = error as Error;
    return { success: false, error: err.message };
  }
}
