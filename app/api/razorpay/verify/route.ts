import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscription } from '@/lib/subscription';
import { auth } from '@/lib/auth';

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string; 
  billingCycle: 'monthly' | 'yearly';
  vaultId: string;
  vaultType: 'org' | 'personal';
  amount: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Payment Verification Started ===");
    
    const session = await auth();
    console.log("Session:", session ? "Valid" : "Invalid");
    console.log("User ID:", session?.user?.id);
    console.log("User account type:", session?.user?.account_type);

    if (!session?.user?.id) {
      console.error("Unauthorized: No session");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const data: VerifyPaymentRequest = await request.json();
    console.log("Verification request data:", {
      ...data,
      razorpay_signature: data.razorpay_signature ? "[PRESENT]" : "[MISSING]",
      vaultType: data.vaultType,
      vaultId: data.vaultId
    });

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId,
      billingCycle,
      vaultId,
      vaultType,
      amount,
    } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("Missing Razorpay fields:", {
        order_id: !!razorpay_order_id,
        payment_id: !!razorpay_payment_id,
        signature: !!razorpay_signature,
      });
      return NextResponse.json(
        { error: "Missing required payment details" },
        { status: 400 }
      );
    }

    if (!planId || !billingCycle || !vaultId) {
      console.error("Missing subscription fields:", {
        planId: !!planId,
        billingCycle: !!billingCycle,
        vaultId: !!vaultId,
        vaultType: vaultType || "NOT PROVIDED",
      });
      return NextResponse.json(
        { error: "Missing subscription details" },
        { status: 400 }
      );
    }

    if (!vaultType || (vaultType !== 'org' && vaultType !== 'personal')) {
      console.error("Invalid vault type:", vaultType);
      return NextResponse.json(
        { error: "Invalid vault type. Must be 'org' or 'personal'" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error("Invalid amount:", amount, typeof amount);
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!razorpaySecret) {
      console.error("CRITICAL: Razorpay secret not configured");
      throw new Error("Razorpay secret not configured");
    }

    console.log("Verifying signature...");
    
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Signature verification FAILED');
      console.error('Expected:', generatedSignature.substring(0, 20) + "...");
      console.error('Received:', razorpay_signature.substring(0, 20) + "...");
      
      return NextResponse.json(
        { error: "Invalid payment signature. Payment verification failed." },
        { status: 400 }
      );
    }

    console.log('✓ Payment signature verified successfully');

    const normalizedPlanId = planId.toLowerCase();
    console.log("Normalized planId:", normalizedPlanId);

    const prismaBillingCycle = billingCycle === 'yearly' ? 'annually' : 'monthly';
    console.log("Prisma billing cycle:", prismaBillingCycle);

    console.log("Updating subscription in database...");
    console.log("Subscription params:", {
      vaultId,
      userId: session.user.id,
      planId: normalizedPlanId,
      billingCycle: prismaBillingCycle,
      vaultType,
      amount
    });
    
    const result = await updateUserSubscription({
      vaultId,
      userId: session.user.id,
      planId: normalizedPlanId as 'basic' | 'professional' | 'enterprise', 
      billingCycle: prismaBillingCycle as 'monthly' | 'annually',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: amount, 
      vaultType: vaultType as 'org' | 'personal',
    });

    console.log("Update subscription result:", {
      success: result.success,
      error: result.error,
      hasSubscription: !!result.subscription
    });

    if (!result.success) {
      console.error('Failed to update subscription:', result.error);
      return NextResponse.json(
        { error: result.error || "Failed to activate subscription" },
        { status: 500 }
      );
    }

    // @ts-expect-error --- IGNORE ---
    console.log('✓ Subscription updated successfully:', result.subscription?.id);

    const response = {
      success: true,
      message: "Payment verified and subscription activated successfully",
      subscription: {
        // @ts-expect-error --- IGNORE ---
        id: result.subscription?.id,
        // @ts-expect-error --- IGNORE ---
        plan: result.subscription?.plan,
        // @ts-expect-error --- IGNORE ---
        status: result.subscription?.status,
        // @ts-expect-error --- IGNORE ---
        nextBillingDate: result.subscription?.next_billing_date,
      },
    };
    console.log("Returning success response");

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("=== Payment Verification Error ===");
    console.error("Error details:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Payment verification failed. Please contact support.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}