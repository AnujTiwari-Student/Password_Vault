"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

interface SecuritySettings {
  require_2fa: boolean;
  session_timeout: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    expiry_days: number;
  };
}

export async function updateSecuritySettings(
  organizationId: string,
  settings: SecuritySettings
) {
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

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return {
        success: false,
        error: "Only admins can update security settings",
      };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!organization?.features.includes("advanced_security")) {
      return {
        success: false,
        error: "Advanced security is not available in your plan",
        upgrade_required: true,
      };
    }

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "settings_updated",
        subject_type: "org",
        subject_id: organizationId,
        ts: new Date(),
        meta: {
          type: "security_settings",
          settings: settings,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "security_settings_updated",
        subject_type: "organization",
        meta: {
          organization_id: organizationId,
          settings: settings,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/organizations/${organizationId}/settings`);

    return {
      success: true,
      message: "Security settings updated successfully",
    };
  } catch (error) {
    console.error("Update security settings error:", error);
    return { success: false, error: "Failed to update security settings" };
  }
}

export async function getActiveSessions(organizationId: string) {
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

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const sessions = await prisma.logs.findMany({
      where: {
        action: "user_login",
        subject_type: "session",
        meta: {
          path: ["organization_id"],
          equals: organizationId,
        },
      },
      orderBy: { ts: "desc" },
      take: 50,
    });

    const activeSessions = sessions.map((log) => ({
      id: log.id,
      user_id: log.user_id,
      ip_address: log.ip,
      user_agent: log.ua,
      login_time: log.ts,
      meta: log.meta,
    }));

    return {
      success: true,
      data: activeSessions,
    };
  } catch (error) {
    console.error("Get active sessions error:", error);
    return { success: false, error: "Failed to get active sessions" };
  }
}

export async function revokeSession(sessionId: string, organizationId: string) {
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

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return { success: false, error: "Only admins can revoke sessions" };
    }

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "session_revoked",
        subject_type: "session",
        meta: {
          session_id: sessionId,
          organization_id: organizationId,
          revoked_by: session.user.id,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "session_revoked",
        subject_type: "member",
        subject_id: sessionId,
        ts: new Date(),
        meta: {
          session_id: sessionId,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/organizations/${organizationId}/sessions`);

    return {
      success: true,
      message: "Session revoked successfully",
    };
  } catch (error) {
    console.error("Revoke session error:", error);
    return { success: false, error: "Failed to revoke session" };
  }
}
