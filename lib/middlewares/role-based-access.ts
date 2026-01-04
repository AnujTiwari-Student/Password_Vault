import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { MemberRole } from "@prisma/client";

export function requireRole(allowedRoles: MemberRole[]) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json();
      const { organizationId, org_id } = body;
      const orgId = organizationId || org_id;

      if (!orgId) {
        return null;
      }

      const membership = await prisma.membership.findUnique({
        where: {
          org_id_user_id: {
            org_id: orgId,
            user_id: session.user.id,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership || !allowedRoles.includes(membership.role)) {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_PERMISSIONS",
            message: "You do not have permission to perform this action",
            required_role: allowedRoles,
            current_role: membership?.role || "none",
          },
          { status: 403 }
        );
      }

      return null;
    } catch (error) {
      console.error("Role-based access check error:", error);
      return NextResponse.json(
        { error: "Failed to check role permissions" },
        { status: 500 }
      );
    }
  };
}

export const PERMISSIONS = {
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
} as const;
