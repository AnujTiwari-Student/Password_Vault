import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-client";

export async function POST() {
  try {
    const products = await stripe.products.list({ limit: 100 });

    if (!products?.data?.length) {
      return NextResponse.json({ error: "No products found" }, { status: 400 });
    }
    
    const proPrices = await stripe.prices.list({
      limit: 10,
      active: true,
    });

    const enterprisePrices = await stripe.prices.list({
      limit: 10,
      active: true,
    });

    const configurations = await stripe.billingPortal.configurations.list({
      limit: 1,
    });

    let configId = configurations.data[0]?.id;

    if (!configId) {
      const config = await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: "Manage your subscription",
        },
        features: {
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          subscription_cancel: {
            enabled: true,
            mode: "at_period_end",
            cancellation_reason: {
              enabled: true,
              options: [
                "too_expensive",
                "missing_features",
                "switched_service",
                "unused",
                "other",
              ],
            },
          },
          subscription_update: {
            enabled: true,
            default_allowed_updates: ["price", "quantity", "promotion_code"],
            proration_behavior: "create_prorations",
            products: proPrices.data.concat(enterprisePrices.data).map(price => ({
              product: price.product as string,
              prices: [price.id],
            })),
          },
        },
      });
      configId = config.id;
    }

    return NextResponse.json({ 
      success: true, 
      configId,
      message: "Portal configuration created successfully" 
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error setting up portal:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
