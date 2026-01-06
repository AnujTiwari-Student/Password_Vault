"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { MemberRole, Prisma } from "@prisma/client";

type Permission =
  | "create_vault"
  | "delete_vault"
  | "manage_members"
  | "change_settings"
  | "view_audit_logs"
  | "manage_billing"
  | "assign_roles"
  | "delete_organization"
  | "manage_team_members"
  | "view_team_vaults"
  | "assign_items"
  | "view_assigned_vaults"
  | "add_items"
  | "edit_own_items"
  | "view_items";

const ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  owner: [
    "create_vault",
    "delete_vault",
    "manage_members",
    "change_settings",
    "view_audit_logs",
    "manage_billing",
    "assign_roles",
    "delete_organization",
  ],
  admin: [
    "create_vault",
    "delete_vault",
    "manage_members",
    "change_settings",
    "view_audit_logs",
    "manage_billing",
    "assign_roles",
  ],
  manager: [
    "create_vault",
    "manage_team_members",
    "view_team_vaults",
    "assign_items",
  ],
  member: ["view_assigned_vaults", "add_items", "edit_own_items"],
  viewer: ["view_assigned_vaults", "view_items"],
};

export async function getPermissions(): Promise<Record<MemberRole, readonly Permission[]>> {
  return ROLE_PERMISSIONS;
}

export async function updateMemberRole(
  organizationId: string,
  userId: string,
  newRole: MemberRole
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const actorMembership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: session.user.id,
        },
      },
    });

    if (
      !actorMembership ||
      !["admin", "owner"].includes(actorMembership.role)
    ) {
      return { success: false, error: "Only admins can assign roles" };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true, owner_user_id: true },
    });

    if (!organization?.features.includes("role_based_access")) {
      return {
        success: false,
        error: "Role-based access control is not available in your plan",
        upgrade_required: true,
      };
    }

    if (organization.owner_user_id === userId && newRole !== "owner") {
      return {
        success: false,
        error: "Cannot change the role of the organization owner",
      };
    }

    const updatedMembership = await prisma.membership.update({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
      data: {
        role: newRole,
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "role_changed",
        subject_type: "member",
        subject_id: userId,
        ts: new Date(),
        meta: {
          old_role: actorMembership.role,
          new_role: newRole,
          user_id: userId,
        } as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      data: updatedMembership,
    };
  } catch (error) {
    console.error("Update member role error:", error);
    return { success: false, error: "Failed to update member role" };
  }
}

export async function getMemberPermissions(
  organizationId: string,
  userId: string
) {
  try {
    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    const rolePermissions = ROLE_PERMISSIONS[membership.role] || [];
    const customPermissions = membership.permissions || [];

    return {
      success: true,
      data: {
        role: membership.role,
        permissions: [...new Set([...rolePermissions, ...customPermissions])],
      },
    };
  } catch (error) {
    console.error("Get member permissions error:", error);
    return { success: false, error: "Failed to get member permissions" };
  }
}

export async function checkPermission(
  organizationId: string,
  userId: string,
  permission: string
) {
  try {
    const result = await getMemberPermissions(organizationId, userId);

    if (!result.success || !result.data) {
      return { success: false, hasPermission: false };
    }

    const hasPermission = result.data.permissions.includes(permission);

    return {
      success: true,
      hasPermission,
    };
  } catch (error) {
    console.error("Check permission error:", error);
    return { success: false, hasPermission: false };
  }
}

export async function assignCustomPermission(
  organizationId: string,
  userId: string,
  permission: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const actorMembership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: session.user.id,
        },
      },
    });

    if (
      !actorMembership ||
      !["admin", "owner"].includes(actorMembership.role)
    ) {
      return { success: false, error: "Only admins can assign permissions" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    const currentPermissions = membership.permissions || [];
    if (currentPermissions.includes(permission)) {
      return { success: false, error: "Permission already assigned" };
    }

    const updatedMembership = await prisma.membership.update({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
      data: {
        permissions: [...currentPermissions, permission],
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "permission_assigned",
        subject_type: "member",
        subject_id: userId,
        ts: new Date(),
        meta: {
          permission: permission,
          user_id: userId,
        } as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/organizations/${organizationId}/members/${userId}`);

    return {
      success: true,
      data: updatedMembership,
    };
  } catch (error) {
    console.error("Assign custom permission error:", error);
    return { success: false, error: "Failed to assign permission" };
  }
}

export async function revokeCustomPermission(
  organizationId: string,
  userId: string,
  permission: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const actorMembership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: session.user.id,
        },
      },
    });

    if (
      !actorMembership ||
      !["admin", "owner"].includes(actorMembership.role)
    ) {
      return { success: false, error: "Only admins can revoke permissions" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    const currentPermissions = membership.permissions || [];
    const updatedPermissions = currentPermissions.filter(
      (p) => p !== permission
    );

    const updatedMembership = await prisma.membership.update({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
      data: {
        permissions: updatedPermissions,
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "permission_revoked",
        subject_type: "member",
        subject_id: userId,
        ts: new Date(),
        meta: {
          permission: permission,
          user_id: userId,
        } as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/organizations/${organizationId}/members/${userId}`);

    return {
      success: true,
      data: updatedMembership,
    };
  } catch (error) {
    console.error("Revoke custom permission error:", error);
    return { success: false, error: "Failed to revoke permission" };
  }
}
