"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { AuditSubjectType, Prisma } from "@prisma/client";

type TrackableAction = 
  | "user_login"
  | "user_logout"
  | "vault_created"
  | "vault_deleted"
  | "vault_shared"
  | "item_created"
  | "item_viewed"
  | "item_updated"
  | "item_deleted"
  | "member_invited"
  | "member_removed"
  | "role_changed"
  | "settings_updated"
  | "export_data"
  | "failed_login_attempt";

export async function getTrackableActions(): Promise<TrackableAction[]> {
  return [
    "user_login",
    "user_logout",
    "vault_created",
    "vault_deleted",
    "vault_shared",
    "item_created",
    "item_viewed",
    "item_updated",
    "item_deleted",
    "member_invited",
    "member_removed",
    "role_changed",
    "settings_updated",
    "export_data",
    "failed_login_attempt",
  ];
}

export async function createAuditLog(
  organizationId: string,
  action: string,
  details: {
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const auditLog = await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: action,
        subject_type: details.resourceType as AuditSubjectType,
        subject_id: details.resourceId,
        ip: details.ipAddress,
        ua: details.userAgent,
        ts: new Date(),
        meta: (details.metadata || {}) as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: auditLog,
    };
  } catch (error) {
    console.error("Create audit log error:", error);
    return { success: false, error: "Failed to create audit log" };
  }
}

export async function getAuditLogs(
  organizationId: string,
  filters?: {
    from?: string;
    to?: string;
    action?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }
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
        error: "Insufficient permissions to view audit logs",
      };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!organization?.features.includes("advanced_audit_logs")) {
      return {
        success: false,
        error: "Advanced audit logs are not available in your plan",
        upgrade_required: true,
      };
    }

    interface WhereClause {
      org_id: string;
      ts?: {
        gte?: Date;
        lte?: Date;
      };
      action?: string;
      actor_user_id?: string;
    }

    const where: WhereClause = { org_id: organizationId };

    if (filters?.from || filters?.to) {
      where.ts = {};
      if (filters.from) where.ts.gte = new Date(filters.from);
      if (filters.to) where.ts.lte = new Date(filters.to);
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.user_id) {
      where.actor_user_id = filters.user_id;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { ts: "desc" },
        take: limit,
        skip,
      }),
      prisma.audit.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Get audit logs error:", error);
    return { success: false, error: "Failed to get audit logs" };
  }
}

export async function exportAuditLogs(
  organizationId: string,
  filters?: {
    from?: string;
    to?: string;
    format?: "csv" | "json";
  }
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
      return { success: false, error: "Insufficient permissions" };
    }

    interface WhereClause {
      org_id: string;
      ts?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = { org_id: organizationId };

    if (filters?.from || filters?.to) {
      where.ts = {};
      if (filters.from) where.ts.gte = new Date(filters.from);
      if (filters.to) where.ts.lte = new Date(filters.to);
    }

    const logs = await prisma.audit.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { ts: "desc" },
    });

    await createAuditLog(organizationId, "export_data", {
      resourceType: "audit",
      metadata: {
        export_format: filters?.format || "csv",
        records_count: logs.length,
        filters: filters,
      },
    });

    return {
      success: true,
      data: {
        logs,
        format: filters?.format || "csv",
        exported_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Export audit logs error:", error);
    return { success: false, error: "Failed to export audit logs" };
  }
}

export async function configureRetentionPolicy(
  organizationId: string,
  policy: {
    deleted_items_retention_days: number;
    audit_logs_retention_days: number;
    automatic_backup: boolean;
    backup_frequency: "daily" | "weekly" | "monthly";
  }
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
        error: "Only admins can configure retention policies",
      };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!organization?.features.includes("advanced_compliance")) {
      return {
        success: false,
        error: "Advanced compliance is not available in your plan",
        upgrade_required: true,
      };
    }

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "retention_policy_configured",
        subject_type: "organization",
        meta: {
          organization_id: organizationId,
          policy: policy,
        },
      },
    });

    await createAuditLog(organizationId, "settings_updated", {
      resourceType: "org",
      resourceId: organizationId,
      metadata: {
        type: "retention_policy",
        policy: policy,
      },
    });

    return {
      success: true,
      message: "Retention policy configured successfully",
    };
  } catch (error) {
    console.error("Configure retention policy error:", error);
    return { success: false, error: "Failed to configure retention policy" };
  }
}

export async function generateComplianceReport(
  organizationId: string,
  options: {
    type: "pci-dss" | "hipaa" | "gdpr" | "sox";
    period: string;
    format: "pdf" | "json";
  }
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
      return { success: false, error: "Insufficient permissions" };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true, name: true },
    });

    if (!organization?.features.includes("advanced_compliance")) {
      return {
        success: false,
        error: "Advanced compliance is not available in your plan",
        upgrade_required: true,
      };
    }

    const reportId = `report_${Date.now()}`;

    await createAuditLog(organizationId, "compliance_report_generated", {
      resourceType: "org",
      resourceId: organizationId,
      metadata: {
        report_id: reportId,
        report_type: options.type,
        period: options.period,
        format: options.format,
      },
    });

    return {
      success: true,
      data: {
        report_id: reportId,
        download_url: `/downloads/compliance-report-${reportId}.${options.format}`,
        generated_at: new Date().toISOString(),
        organization_name: organization.name,
        report_type: options.type,
        period: options.period,
      },
    };
  } catch (error) {
    console.error("Generate compliance report error:", error);
    return { success: false, error: "Failed to generate compliance report" };
  }
}
