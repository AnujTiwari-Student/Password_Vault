import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import { auth } from '@/lib/auth';

const PRICING = {
  personal: {
    basic: { monthly: 0, yearly: 0 },
    professional: { monthly: 299, yearly: 2990 },  
    enterprise: { monthly: 999, yearly: 9990 },
  },
  org: {
    basic: { monthly: 0, yearly: 0 },
    professional: { monthly: 499, yearly: 4990 },  
    enterprise: { monthly: 1499, yearly: 14990 },
  },
};

const PLAN_ID_MAP: Record<string, string> = {
  'free': 'basic',
  'basic': 'basic',
  'pro': 'professional',           
  'professional': 'professional', 
  'enterprise': 'enterprise',
};

interface CreateRazorpayOrderRequest {
  planId: string;
  billingCycle: string;
  vaultId: string;
  vaultType: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Razorpay Order Creation Started ===");
    
    const session = await auth();
    console.log("Session:", session ? "Valid" : "Invalid");

    if (!session?.user?.id) {
      console.error("Unauthorized: No session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const data: CreateRazorpayOrderRequest = await request.json();
    console.log("Request data received:", data);

    const { planId, billingCycle, vaultId, vaultType } = data;

    if (!planId || !billingCycle || !vaultId || !vaultType) {
      console.error("Missing fields:", { planId, billingCycle, vaultId, vaultType });
      return NextResponse.json(
        { 
          error: "Missing required fields",
          details: {
            planId: !planId ? "missing" : "ok",
            billingCycle: !billingCycle ? "missing" : "ok",
            vaultId: !vaultId ? "missing" : "ok",
            vaultType: !vaultType ? "missing" : "ok",
          }
        },
        { status: 400 }
      );
    }

    const normalizedPlanId = PLAN_ID_MAP[planId.toLowerCase()] || planId.toLowerCase();
    console.log("Original planId:", planId);
    console.log("Normalized planId:", normalizedPlanId);

    if (normalizedPlanId === 'basic' || normalizedPlanId === 'free') {
      console.error("Cannot create payment for basic/free plan");
      return NextResponse.json(
        { error: "Cannot create payment for basic (free) plan" },
        { status: 400 }
      );
    }

    if (vaultType !== 'org' && vaultType !== 'personal') {
      console.error("Invalid vaultType:", vaultType);
      return NextResponse.json(
        { error: "Invalid vault type. Must be 'org' or 'personal'" },
        { status: 400 }
      );
    }

    if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      console.error("Invalid billingCycle:", billingCycle);
      return NextResponse.json(
        { error: "Invalid billing cycle. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    const vaultPricing = vaultType === "org" ? PRICING.org : PRICING.personal;
    console.log("Vault pricing structure:", Object.keys(vaultPricing));

    if (!vaultPricing[normalizedPlanId as keyof typeof vaultPricing]) {
      console.error("Invalid planId:", normalizedPlanId, "Available plans:", Object.keys(vaultPricing));
      return NextResponse.json(
        { 
          error: `Invalid plan: ${normalizedPlanId}. Available plans: ${Object.keys(vaultPricing).join(', ')}` 
        },
        { status: 400 }
      );
    }

    const price = vaultPricing[normalizedPlanId as keyof typeof vaultPricing][billingCycle as 'monthly' | 'yearly'];
    console.log("Price found:", price);

    if (!price || price === 0) {
      console.error("Invalid price:", price);
      return NextResponse.json(
        { error: "Invalid plan or pricing configuration" },
        { status: 400 }
      );
    }

    const amountInPaise = price * 100;
    console.log("Amount in paise:", amountInPaise);

    if (!amountInPaise || amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
      console.error("Invalid amount:", amountInPaise);
      return NextResponse.json(
        { error: "Invalid amount calculation" },
        { status: 400 }
      );
    }

    console.log("Creating Razorpay order...");
    const razorpay = getRazorpayInstance();
    
    const orderData = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: session.user.id,
        vaultId: vaultId,
        vaultType: vaultType,
        planId: normalizedPlanId,  
        billingCycle: billingCycle,
        userEmail: session.user.email || '',
        userName: session.user.name || '',
      },
    };
    console.log("Order data:", orderData);

    const order = await razorpay.orders.create(orderData);
    console.log("✓ Razorpay order created successfully:", order.id);

    const response = {
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      planDetails: {
        planId: normalizedPlanId,
        billingCycle,
        priceInRupees: price,
        vaultType,
      },
    };
    console.log("Returning response:", response);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("=== Razorpay Order Error ===");
    console.error("Error details:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create payment order",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}