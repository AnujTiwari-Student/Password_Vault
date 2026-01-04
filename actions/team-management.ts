"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: {
  name: string;
  description?: string;
  org_id: string;
  vault_id: string;
  member_ids?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: formData.org_id,
          user_id: session.user.id,
        },
      },
    });

    if (
      !membership ||
      !["admin", "owner", "manager"].includes(membership.role)
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    const organization = await prisma.org.findUnique({
      where: { id: formData.org_id },
      select: { features: true },
    });

    if (!organization?.features.includes("team_management")) {
      return {
        success: false,
        error: "Team management is not available in your plan",
        upgrade_required: true,
      };
    }

    const team = await prisma.team.create({
      data: {
        name: formData.name,
        description: formData.description,
        org_id: formData.org_id,
        vault_id: formData.vault_id,
        created_by: session.user.id,
      },
    });

    revalidatePath(`/organizations/${formData.org_id}/teams`);

    return {
      success: true,
      data: team,
    };
  } catch (error) {
    console.error("Create team error:", error);
    return { success: false, error: "Failed to create team" };
  }
}

export async function assignVaultToTeam(formData: {
  vault_id: string;
  team_id: string;
  permission: "read" | "write";
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const vault = await prisma.vault.findUnique({
      where: { id: formData.vault_id },
      select: { org_id: true },
    });

    if (!vault?.org_id) {
      return {
        success: false,
        error: "Vault not found or not an organization vault",
      };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: vault.org_id,
          user_id: session.user.id,
        },
      },
    });

    if (
      !membership ||
      !["admin", "owner", "manager"].includes(membership.role)
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    const share = await prisma.share.create({
      data: {
        target_type: "vault",
        target_id: formData.vault_id,
        grantee_type: "role",
        grantee_role: formData.team_id,
        view: true,
        edit: formData.permission === "write",
        share: false,
        manage: false,
        vaultId: formData.vault_id,
      },
    });

    revalidatePath(`/vaults/${formData.vault_id}`);

    return {
      success: true,
      data: share,
    };
  } catch (error) {
    console.error("Assign vault to team error:", error);
    return { success: false, error: "Failed to assign vault to team" };
  }
}

export async function getTeamsByOrganization(organizationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: session.user.id,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "Not a member of this organization" };
    }

    const teams = await prisma.team.findMany({
      where: { org_id: organizationId },
      include: {
        vault: {
          select: {
            id: true,
            name: true,
          },
        },
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return {
      success: true,
      data: teams,
    };
  } catch (error) {
    console.error("Get teams error:", error);
    return { success: false, error: "Failed to get teams" };
  }
}
