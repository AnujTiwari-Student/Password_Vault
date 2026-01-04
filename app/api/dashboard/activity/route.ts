import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get("limit") ?? "10", 10);

    if (!Number.isFinite(limit) || limit <= 0) {
      return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
    }

    const recentLogs = await prisma.logs.findMany({
      where: { user_id: user.id },
      orderBy: { ts: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const memberships = await prisma.membership.findMany({
      where: { user_id: user.id },
      select: { org_id: true },
    });

    const orgIds = memberships.map((m) => m.org_id);

    const orgAudits =
      orgIds.length === 0
        ? []
        : await prisma.audit.findMany({
            where: { org_id: { in: orgIds } },
            orderBy: { ts: "desc" },
            take: limit,
            include: {
              actor: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

    const activities = [
      ...recentLogs.map((log) => ({
        id: log.id,
        action: formatAction(log.action),
        item: formatSubjectType(log.subject_type),
        time: formatTimeAgo(log.ts),
        user: log.user.name ?? log.user.email.split("@")[0],
        timestamp: log.ts,
        type: "personal" as const,
      })),
      ...orgAudits.map((audit) => ({
        id: audit.id,
        action: formatAction(audit.action),
        item: formatSubjectType(audit.subject_type),
        time: formatTimeAgo(audit.ts),
        user: audit.actor.name ?? audit.actor.email.split("@")[0],
        timestamp: audit.ts,
        type: "org" as const,
      })),
    ];

    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return NextResponse.json(sortedActivities);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    ITEM_CREATED: "Created item",
    ITEM_UPDATED: "Updated item",
    ITEM_DELETED: "Deleted item",
    ITEM_VIEWED: "Viewed item",
    VAULT_CREATED: "Created vault",
    VAULT_UPDATED: "Updated vault",
    MEMBER_ADDED: "Added member",
    MEMBER_REMOVED: "Removed member",
    PAYMENT_SUCCESS: "Payment completed",
    PAYMENT_ORDER_CREATED: "Payment initiated",
    LOGIN: "Logged in",
    LOGOUT: "Logged out",
    "2FA_ENABLED": "Enabled 2FA",
    "2FA_DISABLED": "Disabled 2FA",
  };

  return actionMap[action] ?? action.toLowerCase().replace(/_/g, " ");
}

function formatSubjectType(subjectType: string): string {
  const typeMap: Record<string, string> = {
    item: "Password",
    vault: "Vault",
    org: "Organization",
    member: "Team member",
    invite: "Invitation",
    billing: "Subscription",
    auth: "Account",
  };

  return typeMap[subjectType.toLowerCase()] ?? subjectType;
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}
