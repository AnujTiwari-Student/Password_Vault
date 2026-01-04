import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org');

    console.log("📦 [GET /api/user/vaults] Called:", { userId: user.id, orgId });

    let vaults = [];

    if (orgId) {
      const membership = await prisma.membership.findFirst({
        where: {
          org_id: orgId,
          user_id: user.id
        }
      });

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const orgVaults = await prisma.vault.findMany({
        where: {
          org_id: orgId,
          type: 'org'
        }
      });

      vaults = await Promise.all(
        orgVaults.map(async (vault) => {
          const subscription = await prisma.subscription.findFirst({
            where: {
              vault_id: vault.id,
              status: 'active'
            },
            orderBy: {
              created_at: 'desc'
            }
          });

          return {
            id: vault.id,
            name: vault.name,
            type: vault.type,
            currentPlan: subscription?.plan || 'free',
            billingCycle: subscription?.billing_cycle || 'monthly',
            amount: subscription?.amount || 0,
            nextBillingDate: subscription?.next_billing_date || null
          };
        })
      );
    } else {
      const personalVaults = await prisma.vault.findMany({
        where: {
          user_id: user.id,
          type: 'personal'
        }
      });

      vaults = await Promise.all(
        personalVaults.map(async (vault) => {
          const subscription = await prisma.subscription.findFirst({
            where: {
              vault_id: vault.id,
              status: 'active'
            },
            orderBy: {
              created_at: 'desc'
            }
          });

          return {
            id: vault.id,
            name: vault.name,
            type: vault.type,
            currentPlan: subscription?.plan || 'free',
            billingCycle: subscription?.billing_cycle || 'monthly',
            amount: subscription?.amount || 0,
            nextBillingDate: subscription?.next_billing_date || null
          };
        })
      );
    }

    console.log("✅ Fetched vaults:", vaults.length);

    return NextResponse.json(vaults);

  } catch (error) {
    console.error("❌ Error fetching vaults:", error);
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
