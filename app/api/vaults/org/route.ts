import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const vaultId = searchParams.get("id");
    const orgId = searchParams.get("org_id");

    if (!vaultId || !orgId) {
      return NextResponse.json(
        { error: "Vault ID and Organization ID are required" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.findFirst({
      where: {
        user_id: user.id,
        org_id: orgId,
      },
    });

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { owner_user_id: true },
    });

    const isOrgOwner = org?.owner_user_id === user.id;

    if (!membership && !isOrgOwner) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    const vault = await prisma.vault.findFirst({
      where: {
        id: vaultId,
        org_id: orgId,
        type: "org",
      },
    });

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found or does not belong to this organization" },
        { status: 404 }
      );
    }

    if (!membership?.ovk_wrapped_for_user) {
      return NextResponse.json(
        { error: "No wrapped OVK found for user in membership" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ovk_wrapped_for_user: membership.ovk_wrapped_for_user,
        wrap_type: "aes",
        org_id: orgId,
        vault_id: vault.id,
        vault_name: vault.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Org vault fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
