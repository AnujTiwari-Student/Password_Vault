"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSupportTicket(formData: {
  subject: string;
  message: string;
  priority?: "low" | "normal" | "high";
  organization_id?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const ticket = await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "support_ticket_created",
        subject_type: "support",
        ip: null,
        ua: null,
        meta: {
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority || "normal",
          organization_id: formData.organization_id,
          status: "open",
        },
      },
    });

    revalidatePath("/support");

    return {
      success: true,
      data: {
        ticket_id: ticket.id,
        status: "open",
        created_at: ticket.ts,
      },
    };
  } catch (error) {
    console.error("Create support ticket error:", error);
    return { success: false, error: "Failed to create support ticket" };
  }
}

export async function getOrganizationUsage(organizationId: string) {
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

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: {
        max_vaults: true,
        max_items: true,
        max_members: true,
      },
    });

    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    const [vaultsUsed, itemsUsed, membersUsed] = await Promise.all([
      prisma.vault.count({
        where: { org_id: organizationId },
      }),
      prisma.item.count({
        where: {
          vault: {
            org_id: organizationId,
          },
        },
      }),
      prisma.membership.count({
        where: { org_id: organizationId },
      }),
    ]);

    const calculatePercentage = (used: number, limit: number | null) => {
      if (limit === null) return 0;
      return Math.round((used / limit) * 100);
    };

    return {
      success: true,
      data: {
        vaults: {
          used: vaultsUsed,
          limit: organization.max_vaults,
          percentage: calculatePercentage(vaultsUsed, organization.max_vaults),
        },
        items: {
          used: itemsUsed,
          limit: organization.max_items,
          percentage: calculatePercentage(itemsUsed, organization.max_items),
        },
        members: {
          used: membersUsed,
          limit: organization.max_members,
          percentage: calculatePercentage(
            membersUsed,
            organization.max_members
          ),
        },
      },
    };
  } catch (error) {
    console.error("Get organization usage error:", error);
    return { success: false, error: "Failed to get organization usage" };
  }
}
