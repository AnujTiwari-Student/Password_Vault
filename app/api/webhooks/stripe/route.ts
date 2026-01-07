import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleChargeRefunded,
} from "@/actions/stripe-action";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe-client";

export async function POST(req: Request) {
  console.log("🎯 ========================================");
  console.log("🎯 WEBHOOK ENDPOINT HIT!");
  console.log("🎯 Time:", new Date().toISOString());
  console.log("🎯 ========================================");
  
  try {
    const body = await req.text();
    console.log("📦 Webhook body received, length:", body.length);
    
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    
    console.log("🔑 Stripe signature present:", !!signature);
    console.log("🔐 Webhook secret configured:", !!STRIPE_CONFIG.webhookSecret);
    console.log("🔐 Webhook secret (first 10 chars):", STRIPE_CONFIG.webhookSecret?.substring(0, 10));

    if (!signature) {
      console.error("❌ Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    if (!STRIPE_CONFIG.webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.webhookSecret
      );
      console.log("✅ Webhook signature verified successfully");
    } catch (err) {
      const error = err as Error;
      console.error(`❌ Webhook signature verification failed: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    console.log(`📥 Processing webhook event: ${event.type} (ID: ${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;

          console.log(`✅ Checkout session completed: ${session.id}`);
          console.log(`📋 Session data:`, JSON.stringify({
            customer: session.customer,
            subscription: session.subscription,
            amount_total: session.amount_total,
            metadata: session.metadata
          }, null, 2));

          await handleCheckoutCompleted({
            id: session.id,
            customer: session.customer as string,
            subscription: session.subscription as string,
            amount_total: session.amount_total || 0,
            metadata: {
              userId: session.metadata?.userId || "",
              vaultId: session.metadata?.vaultId || "",
              vaultType: session.metadata?.vaultType || "personal",
              planId: session.metadata?.planId || "pro",
              billingCycle: session.metadata?.billingCycle || "monthly",
            },
          });

          console.log("✅ Checkout session processed successfully");
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;

          console.log(`🔄 Subscription updated: ${subscription.id}`);

          await handleSubscriptionUpdated({
            id: subscription.id,
            customer:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,

            status: subscription.status,

            items: {
              data: subscription.items.data.map((item) => ({
                price: {
                  id: item.price.id,
                  unit_amount: item.price.unit_amount ?? 0,
                },
              })),
            },

            // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
            current_period_start: subscription.current_period_start || 0,
            // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
            current_period_end: subscription.current_period_end || 0,

            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at,

            metadata: subscription.metadata ?? {},
          });

          console.log("✅ Subscription updated successfully");
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;

          console.log(`❌ Subscription deleted: ${subscription.id}`);

          await handleSubscriptionDeleted({
            id: subscription.id,
            customer: subscription.customer as string,
            metadata: subscription.metadata || {},
          });

          console.log("✅ Subscription deletion processed successfully");
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;

          console.log(`💰 Invoice payment succeeded: ${invoice.id}`);

          const subscriptionId =
          // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
            typeof invoice.subscription === "string"
            // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
              ? invoice.subscription
              // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
              : invoice.subscription?.id ?? null;

          if (!subscriptionId) {
            console.log("ℹ️ Invoice not related to subscription, skipping");
            break;
          }

          await handleInvoicePaid({
            id: invoice.id,
            customer:
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id ?? "",
            subscription: subscriptionId,
            amount_paid: invoice.amount_paid,
            billing_reason: invoice.billing_reason ?? "",
          });

          console.log("✅ Invoice paid processed successfully");
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;

          console.log(`⚠️ Invoice payment failed: ${invoice.id}`);

          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id ?? null;

          if (!customerId) {
            console.log("ℹ️ Invoice missing customer, skipping");
            break;
          }

          const subscriptionId =
          // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
            typeof invoice.subscription === "string"
            // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
              ? invoice.subscription
              // @ts-expect-error TS(2345): Argument of type 'number | null' is not assignable to parameter of type 'number'.
              : invoice.subscription?.id ?? null;

          if (!subscriptionId) {
            console.log("ℹ️ Invoice not related to subscription, skipping");
            break;
          }

          await handleInvoicePaymentFailed({
            id: invoice.id,
            customer: customerId,
            subscription: subscriptionId,
            amount_due: invoice.amount_due,
            last_payment_error: invoice.last_finalization_error
              ? { message: invoice.last_finalization_error.message ?? "" }
              : undefined,
          });

          console.log("✅ Invoice payment failure processed successfully");
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;

          console.log(`💸 Charge refunded: ${charge.id}`);

          const customerId =
            typeof charge.customer === "string"
              ? charge.customer
              : charge.customer?.id ?? null;

          if (!customerId) {
            console.log("ℹ️ Refunded charge missing customer, skipping");
            break;
          }

          await handleChargeRefunded({
            id: charge.id,
            customer: customerId,
            amount_refunded: charge.amount_refunded,

            refunds: {
              data:
                charge.refunds?.data.map((refund) => ({
                  reason: refund.reason ?? null,
                })) ?? [],
            },
          });

          console.log("✅ Charge refunded processed successfully");
          break;
        }

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      console.log("✅ Webhook processed successfully, returning 200");
      return NextResponse.json(
        { received: true, eventType: event.type },
        { status: 200 }
      );
    } catch (handlerError) {
      const error = handlerError as Error;
      console.error(`❌ Event handler failed for ${event.type}:`, error);
      console.error("❌ Error stack:", error.stack);

      return NextResponse.json(
        {
          received: true,
          error: error.message,
          note: "Event received but processing failed",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Webhook handler failed:", err);
    console.error("❌ Error stack:", err.stack);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 500 }
    );
  }
}