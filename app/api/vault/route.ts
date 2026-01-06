import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const personalVaults = await prisma.vault.findMany({
      where: {
        user_id: user.id,
        type: "personal"
      },
      select: {
        id: true,
        name: true,
        type: true,
        created_at: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const memberships = await prisma.membership.findMany({
      where: {
        user_id: user.id
      },
      select: {
        org_id: true,
        role: true
      }
    });

    const orgIds = memberships.map(m => m.org_id);

    const orgVaults = await prisma.vault.findMany({
      where: {
        type: "org",
        org_id: { in: orgIds }
      },
      include: {
        org: {
          select: {
            name: true,
            owner_user_id: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const vaultsWithPermissions = orgVaults.map(vault => {
      const membership = memberships.find(m => m.org_id === vault.org_id);
      const isOwner = vault.org?.owner_user_id === user.id;
      const canEdit = isOwner || membership?.role === "admin" || membership?.role === "owner";

      return {
        id: vault.id,
        name: vault.name,
        type: vault.type,
        created_at: vault.created_at,
        org_name: vault.org?.name,
        can_edit: canEdit
      };
    });

    const allVaults = [
      ...personalVaults.map(v => ({ ...v, can_edit: true, org_name: null })),
      ...vaultsWithPermissions
    ];

    return NextResponse.json({ vaults: allVaults }, { status: 200 });

  } catch (error) {
    console.error("Error fetching vaults:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
