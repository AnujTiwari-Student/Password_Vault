import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";
import { getRazorpayInstance } from "@/lib/razorpay";

type RazorpayOrderNotes = {
  user_id: string;
  vault_id: string;
  plan: string;
  billing_cycle: string;
  vault_type: "personal" | "org";
};

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return NextResponse.json(
        { error: "Billing is not configured" },
        { status: 503 }
      );
    }

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const razorpay = getRazorpayInstance();

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.status !== "captured" ||
      payment.order_id !== razorpay_order_id
    ) {
      return NextResponse.json(
        { error: "Payment not captured" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes as RazorpayOrderNotes;

    if (!notes?.vault_id || !notes?.plan || !notes?.billing_cycle) {
      return NextResponse.json(
        { error: "Invalid order notes" },
        { status: 400 }
      );
    }

    const amountPaise = Number(payment.amount);
    if (!Number.isFinite(amountPaise)) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const amount = amountPaise / 100;

    const vault = await prisma.vault.findUnique({
      where: { id: notes.vault_id },
      include: { org: true },
    });

    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    const allowed =
      (vault.type === "personal" && vault.user_id === user.id) ||
      (vault.type === "org" && vault.org?.owner_user_id === user.id);

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextBillingDate = new Date();
    if (notes.billing_cycle === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const existing = await prisma.subscription.findFirst({
      where: { vault_id: notes.vault_id },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan: notes.plan,
          billing_cycle: notes.billing_cycle,
          status: "active",
          amount,
          currency: payment.currency,
          next_billing_date: nextBillingDate,
          last_payment_date: new Date(),
          razorpay_order_id,
          razorpay_payment_id,
          payment_method: payment.method ?? null,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          vault_id: notes.vault_id,
          user_id: user.id,
          plan: notes.plan,
          billing_cycle: notes.billing_cycle,
          status: "active",
          amount,
          currency: payment.currency,
          next_billing_date: nextBillingDate,
          last_payment_date: new Date(),
          razorpay_order_id,
          razorpay_payment_id,
          payment_method: payment.method ?? null,
        },
      });
    }

    await prisma.logs.create({
      data: {
        user_id: user.id,
        action: "PAYMENT_SUCCESS",
        subject_type: "subscription",
        meta: {
          vault_id: notes.vault_id,
          plan: notes.plan,
          billing_cycle: notes.billing_cycle,
          amount,
          currency: payment.currency,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        nextBillingDate: nextBillingDate.toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Payment verification failed:", err);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
