import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📊 [GET /api/dashboard/stats] Called:", { userId: user.id });

    // Get all vaults where user is owner or has access
    const userVaults = await prisma.vault.findMany({
      where: {
        OR: [
          { user_id: user.id, type: "personal" },
          { 
            type: "org",
            org_id: {
              in: (await prisma.membership.findMany({
                where: { user_id: user.id },
                select: { org_id: true }
              })).map(m => m.org_id)
            }
          }
        ]
      }
    });

    const vaultIds = userVaults.map(v => v.id);

    // Count total items across all user's vaults
    const totalItems = await prisma.item.count({
      where: {
        vault_id: { in: vaultIds }
      }
    });

    // Get primary vault type
    const primaryVault = userVaults.find(v => v.user_id === user.id) || userVaults[0];
    const vaultType = primaryVault?.type || 'personal';

    // Count memberships (teams joined)
    const teamsJoined = await prisma.membership.count({
      where: { user_id: user.id }
    });

    // Count org vaults if user is in org
    let sharedVaults = 0;
    if (vaultType === 'org' && primaryVault?.org_id) {
      sharedVaults = await prisma.vault.count({
        where: {
          org_id: primaryVault.org_id,
          type: "org"
        }
      });
    } else {
      sharedVaults = teamsJoined;
    }

    // Calculate security score
    let securityScore = 0;

    // Check 2FA status (40 points)
    const userWith2FA = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twofa_enabled: true }
    });

    if (userWith2FA?.twofa_enabled) {
      securityScore += 40;
    }

    // Check items with URLs (30 points)
    if (totalItems > 0) {
      const itemsWithUrl = await prisma.item.count({
        where: {
          vault_id: { in: vaultIds },
          url: { not: null }
        }
      });
      securityScore += Math.round((itemsWithUrl / totalItems) * 30);
    } else {
      securityScore += 30; // Default if no items
    }

    // Check recently updated items (30 points)
    if (totalItems > 0) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentItems = await prisma.item.count({
        where: {
          vault_id: { in: vaultIds },
          updated_at: { gte: threeMonthsAgo }
        }
      });
      securityScore += Math.round((recentItems / totalItems) * 30);
    } else {
      securityScore += 30; // Default if no items
    }

    const stats = {
      totalItems,
      sharedVaults,
      teamsJoined,
      securityScore: Math.min(securityScore, 100),
      vaultType
    };

    console.log("✅ Dashboard stats calculated:", stats);

    return NextResponse.json(stats);

  } catch (error: unknown) {
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
