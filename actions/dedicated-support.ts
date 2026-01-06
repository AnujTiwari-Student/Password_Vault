"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

interface TicketMetadata {
  organization_id: string;
  priority: "normal" | "high" | "critical";
  subject: string;
  message: string;
  contact_phone?: string;
  plan_type: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  sla: string;
}

interface TicketUpdateMetadata {
  ticket_id: string;
  old_status: string;
  new_status: string;
  organization_id: string;
}

export async function createEnterpriseSupportTicket(formData: {
  organization_id: string;
  priority: "normal" | "high" | "critical";
  subject: string;
  message: string;
  contact_phone?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: formData.organization_id,
          user_id: session.user.id,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "Not a member of this organization" };
    }

    const organization = await prisma.org.findUnique({
      where: { id: formData.organization_id },
      select: { features: true, plan_type: true },
    });

    if (!organization?.features.includes("dedicated_support")) {
      return {
        success: false,
        error: "Dedicated support is not available in your plan",
        upgrade_required: true,
      };
    }

    const slaValue =
      formData.priority === "critical"
        ? "1_hour"
        : formData.priority === "high"
        ? "4_hours"
        : "24_hours";

    const ticketMetadata: TicketMetadata = {
      organization_id: formData.organization_id,
      priority: formData.priority,
      subject: formData.subject,
      message: formData.message,
      contact_phone: formData.contact_phone,
      plan_type: organization.plan_type,
      status: "open",
      sla: slaValue,
    };

    const ticket = await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "enterprise_support_ticket_created",
        subject_type: "support",
        // @ts-expect-error Prisma.JsonValue
        meta: ticketMetadata as Prisma.InputJsonValue,
      },
    });

    await prisma.audit.create({
      data: {
        org_id: formData.organization_id,
        actor_user_id: session.user.id,
        action: "support_ticket_created",
        subject_type: "org",
        subject_id: formData.organization_id,
        ts: new Date(),
        meta: {
          ticket_id: ticket.id,
          priority: formData.priority,
          subject: formData.subject,
        } as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/support");

    return {
      success: true,
      data: {
        ticket_id: ticket.id,
        priority: formData.priority,
        status: "open",
        created_at: ticket.ts,
        sla:
          formData.priority === "critical"
            ? "1 hour"
            : formData.priority === "high"
            ? "4 hours"
            : "24 hours",
      },
    };
  } catch (error) {
    console.error("Create enterprise support ticket error:", error);
    return { success: false, error: "Failed to create support ticket" };
  }
}

export async function getSupportRepresentative(organizationId: string) {
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
      select: { features: true, plan_type: true },
    });

    if (!organization?.features.includes("dedicated_support")) {
      return {
        success: false,
        error: "Dedicated support is not available in your plan",
        upgrade_required: true,
      };
    }

    return {
      success: true,
      data: {
        name: "Sarah Johnson",
        email: "sarah.johnson@passwordmanager.com",
        phone: "+1-800-SUPPORT",
        timezone: "America/New_York",
        availability: "24/7 for Critical issues, 9AM-6PM ET for others",
        languages: ["English", "Spanish"],
      },
    };
  } catch (error) {
    console.error("Get support representative error:", error);
    return { success: false, error: "Failed to get support representative" };
  }
}

export async function getSupportTickets(
  organizationId: string,
  filters?: {
    status?: "open" | "in_progress" | "resolved" | "closed";
    priority?: "normal" | "high" | "critical";
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

    if (!membership) {
      return { success: false, error: "Not a member of this organization" };
    }

    const tickets = await prisma.logs.findMany({
      where: {
        action: "enterprise_support_ticket_created",
        meta: {
          path: ["organization_id"],
          equals: organizationId,
        },
      },
      orderBy: { ts: "desc" },
      take: 50,
    });

    let filteredTickets = tickets;

    if (filters?.status) {
      filteredTickets = filteredTickets.filter((t) => {
        const meta = t.meta as Prisma.JsonObject;
        return meta.status === filters.status;
      });
    }

    if (filters?.priority) {
      filteredTickets = filteredTickets.filter((t) => {
        const meta = t.meta as Prisma.JsonObject;
        return meta.priority === filters.priority;
      });
    }

    const ticketsWithDetails = filteredTickets.map((ticket) => {
      const meta = ticket.meta as Prisma.JsonObject;
      return {
        id: ticket.id,
        subject: meta.subject as string,
        priority: meta.priority as string,
        status: meta.status as string,
        created_at: ticket.ts,
        sla: meta.sla as string,
        contact_phone: meta.contact_phone as string | undefined,
      };
    });

    return {
      success: true,
      data: ticketsWithDetails,
    };
  } catch (error) {
    console.error("Get support tickets error:", error);
    return { success: false, error: "Failed to get support tickets" };
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const ticket = await prisma.logs.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    const meta = ticket.meta as Prisma.JsonObject;

    const updateMetadata: TicketUpdateMetadata = {
      ticket_id: ticketId,
      old_status: meta.status as string,
      new_status: status,
      organization_id: meta.organization_id as string,
    };

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "support_ticket_updated",
        subject_type: "support",
        // @ts-expect-error Prisma.JsonValue
        meta: updateMetadata as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/support");

    return {
      success: true,
      message: "Ticket status updated successfully",
    };
  } catch (error) {
    console.error("Update ticket status error:", error);
    return { success: false, error: "Failed to update ticket status" };
  }
}
