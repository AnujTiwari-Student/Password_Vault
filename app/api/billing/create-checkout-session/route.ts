import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { getRazorpayInstance, PLAN_PRICES } from "@/lib/razorpay";
import { prisma } from "@/db";

type BillingCycle = "monthly" | "yearly";
type VaultType = "personal" | "org";
type PlanId = "pro" | "enterprise";

function isBillingCycle(v: unknown): v is BillingCycle {
  return v === "monthly" || v === "yearly";
}

function isVaultType(v: unknown): v is VaultType {
  return v === "personal" || v === "org";
}

function isPlanId(v: unknown): v is PlanId {
  return v === "pro" || v === "enterprise";
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, billingCycle, vaultId, vaultType } = body as {
      planId?: unknown;
      billingCycle?: unknown;
      vaultId?: unknown;
      vaultType?: unknown;
    };

    if (typeof vaultId !== "string") {
      return NextResponse.json({ error: "Invalid vault id" }, { status: 400 });
    }

    if (!isBillingCycle(billingCycle)) {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    if (!isVaultType(vaultType)) {
      return NextResponse.json({ error: "Invalid vault type" }, { status: 400 });
    }

    if (!isPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (vaultType === "personal") {
      if (planId !== "pro") {
        return NextResponse.json(
          { error: "Enterprise plan is not available for personal vaults" },
          { status: 400 }
        );
      }

      const priceInINR = PLAN_PRICES.personal.pro[billingCycle];
      const amountInPaise = priceInINR * 100;

      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${vaultId}_${Date.now()}`,
      });

      await prisma.logs.create({
        data: {
          user_id: user.id,
          action: "PAYMENT_ORDER_CREATED",
          subject_type: "billing",
          ts: new Date(),
          meta: {
            order_id: order.id,
            amount: priceInINR,
            currency: "INR",
            plan_id: planId,
            billing_cycle: billingCycle,
            vault_id: vaultId,
          },
        },
      });

      return NextResponse.json(
        {
          orderId: order.id,
          amount: amountInPaise,
          currency: "INR",
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        },
        { status: 200 }
      );
    }

    const priceInINR = PLAN_PRICES.org[planId][billingCycle];
    const amountInPaise = priceInINR * 100;

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${vaultId}_${Date.now()}`,
    });

    await prisma.logs.create({
      data: {
        user_id: user.id,
        action: "PAYMENT_ORDER_CREATED",
        subject_type: "billing",
        ts: new Date(),
        meta: {
          order_id: order.id,
          amount: priceInINR,
          currency: "INR",
          plan_id: planId,
          billing_cycle: billingCycle,
          vault_id: vaultId,
        },
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
