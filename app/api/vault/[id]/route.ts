import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function PATCH(
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
    const { name } = await req.json();

    console.log("🔄 [PATCH /api/vault/[id]] Called:", { vaultId, userId: user.id, name });

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Vault name is required" }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ 
        error: "Vault name must be 50 characters or less" 
      }, { status: 400 });
    }

    const existingVault = await prisma.vault.findUnique({
      where: { id: vaultId }
    });

    if (!existingVault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    let hasPermission = false;

    if (existingVault.type === "personal" && existingVault.user_id === user.id) {
      hasPermission = true;
    } else if (existingVault.type === "org" && existingVault.org_id) {
      const org = await prisma.org.findUnique({
        where: { id: existingVault.org_id }
      });

      if (org?.owner_user_id === user.id) {
        hasPermission = true;
      } else {
        const membership = await prisma.membership.findFirst({
          where: {
            org_id: existingVault.org_id,
            user_id: user.id,
            role: { in: ["admin", "owner"] }
          }
        });

        if (membership) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ 
        error: "You don't have permission to update this vault" 
      }, { status: 403 });
    }

    if (existingVault.type === "org" && existingVault.org_id) {
      const duplicate = await prisma.vault.findFirst({
        where: {
          org_id: existingVault.org_id,
          name: name.trim(),
          id: { not: vaultId }
        }
      });

      if (duplicate) {
        return NextResponse.json({ 
          error: "A vault with this name already exists in this organization" 
        }, { status: 400 });
      }
    } else if (existingVault.type === "personal" && existingVault.user_id) {
      const duplicate = await prisma.vault.findFirst({
        where: {
          user_id: existingVault.user_id,
          name: name.trim(),
          id: { not: vaultId }
        }
      });

      if (duplicate) {
        return NextResponse.json({ 
          error: "A vault with this name already exists" 
        }, { status: 400 });
      }
    }

    const updatedVault = await prisma.vault.update({
      where: { id: vaultId },
      data: { name: name.trim() }
    });

    console.log("✅ Vault name updated:", updatedVault.id);

    return NextResponse.json({
      message: "Vault name updated successfully",
      vault: updatedVault
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error updating vault name:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
