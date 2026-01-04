import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id: orgId } = params;

    const membership = await prisma.membership.findFirst({
      where: {
        org_id: orgId,
        user_id: user.id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const vault = await prisma.vault.findFirst({
      where: {
        org_id: orgId,
        type: 'org'
      }
    });

    if (!vault) {
      return NextResponse.json({ success: false, vault: null });
    }

    return NextResponse.json({
      success: true,
      vault: {
        id: vault.id,
        name: vault.name,
        type: vault.type
      }
    });

  } catch (error) {
    console.error("❌ Error fetching org vault:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? message : undefined
      },
      { status: 500 }
    );
  }
}
