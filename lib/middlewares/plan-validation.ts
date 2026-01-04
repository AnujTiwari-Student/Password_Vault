import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/index";

export async function validatePlanLimits(
  req: NextRequest,
  action: "create_vault" | "add_item" | "invite_member"
): Promise<NextResponse | null> {
  try {
    const body = await req.json();
    const { organizationId, org_id } = body;
    const orgId = organizationId || org_id;

    if (!orgId) {
      return null;
    }

    const organization = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        plan_type: true,
        max_vaults: true,
        max_items: true,
        max_members: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "create_vault": {
        const vaultCount = await prisma.vault.count({
          where: { org_id: orgId },
        });

        if (
          organization.max_vaults !== null &&
          vaultCount >= organization.max_vaults
        ) {
          return NextResponse.json(
            {
              error: "LIMIT_REACHED",
              message: `Vault limit reached (${organization.max_vaults} vaults)`,
              current_plan: organization.plan_type,
              upgrade_required: true,
            },
            { status: 403 }
          );
        }
        break;
      }

      case "add_item": {
        if (organization.max_items !== null) {
          const itemCount = await prisma.item.count({
            where: {
              vault: {
                org_id: orgId,
              },
            },
          });

          if (itemCount >= organization.max_items) {
            return NextResponse.json(
              {
                error: "LIMIT_REACHED",
                message: `Item limit reached (${organization.max_items} items)`,
                current_plan: organization.plan_type,
                upgrade_required: true,
              },
              { status: 403 }
            );
          }
        }
        break;
      }

      case "invite_member": {
        const memberCount = await prisma.membership.count({
          where: { org_id: orgId },
        });

        if (
          organization.max_members !== null &&
          memberCount >= organization.max_members
        ) {
          return NextResponse.json(
            {
              error: "LIMIT_REACHED",
              message: `Member limit reached (${organization.max_members} members)`,
              current_plan: organization.plan_type,
              upgrade_required: true,
            },
            { status: 403 }
          );
        }
        break;
      }
    }

    return null;
  } catch (error) {
    console.error("Plan validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate plan limits" },
      { status: 500 }
    );
  }
}
