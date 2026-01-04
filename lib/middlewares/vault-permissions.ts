import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";

export async function checkVaultCreationPermission(
  req: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organization_id, org_id } = body;
    const orgId = organization_id || org_id;

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

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "owner")
    ) {
      return NextResponse.json(
        {
          error: "PERMISSION_DENIED",
          message:
            "Only organization administrators can create organization vaults",
          code: 403,
        },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error("Vault permission check error:", error);
    return NextResponse.json(
      { error: "Failed to check vault creation permission" },
      { status: 500 }
    );
  }
}
