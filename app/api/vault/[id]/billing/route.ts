import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id: vaultId } = params;

    console.log("📊 [GET /api/vault/[id]/billing] Called:", { vaultId, userId: user.id });

    const vault = await prisma.vault.findUnique({
      where: { id: vaultId }
    });

    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    let hasAccess = false;

    if (vault.type === "personal" && vault.user_id === user.id) {
      hasAccess = true;
    } else if (vault.type === "org" && vault.org_id) {
      const org = await prisma.org.findUnique({
        where: { id: vault.org_id }
      });

      if (org?.owner_user_id === user.id) {
        hasAccess = true;
      } else {
        const membership = await prisma.membership.findFirst({
          where: {
            org_id: vault.org_id,
            user_id: user.id
          }
        });
        hasAccess = !!membership;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: "You don't have access to this vault" 
      }, { status: 403 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        status: 'active'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!subscription) {
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        nextBillingDate: null,
        amount: 0,
        paymentMethod: 'None',
        currency: 'INR',
        billingCycle: 'monthly'
      });
    }

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      nextBillingDate: subscription.next_billing_date,
      amount: subscription.amount,
      paymentMethod: subscription.payment_method || 'Razorpay',
      currency: subscription.currency,
      billingCycle: subscription.billing_cycle
    });

  } catch (error) {
    console.error("❌ Error fetching billing data:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? message : undefined
      },
      { status: 500 }
    );
  }
}
