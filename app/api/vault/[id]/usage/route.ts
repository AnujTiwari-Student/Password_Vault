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

    console.log("📈 [GET /api/vault/[id]/usage] Called:", { vaultId, userId: user.id });

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

    const [passwordCount, memberCount, vaultUser] = await Promise.all([
      prisma.item.count({
        where: { vault_id: vaultId }
      }),
      vault.org_id ? prisma.membership.count({
        where: { org_id: vault.org_id }
      }) : Promise.resolve(1),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { twofa_enabled: true }
      })
    ]);

    console.log("📊 Usage stats:", { passwordCount, memberCount });

    const isOrgVault = vault.type === "org";
    const limits = isOrgVault
      ? {
          passwords: 1000,
          members: 50,
          storage: 10 * 1024 * 1024 * 1024,
        }
      : {
          passwords: 100,
          members: 1,
          storage: 1024 * 1024 * 1024,
        };

    const usageData = {
      passwords: {
        current: passwordCount,
        limit: limits.passwords,
      },
      members: {
        current: memberCount,
        limit: limits.members,
      },
      storage: {
        current: 0,
        limit: limits.storage,
      },
      twoFaEnabled: vaultUser?.twofa_enabled || false,
    };

    console.log("✅ Returning usage data");

    return NextResponse.json(usageData, { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching usage data:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
