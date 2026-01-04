import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const params = await context.params;
    const orgId = params.orgId;

    const orgVaultKey = await prisma.orgVaultKey.findFirst({
      where: { org_id: orgId },
      select: { ovk_cipher: true }
    });

    if (!orgVaultKey) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Organization vault key not found"] }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      raw_ovk: orgVaultKey.ovk_cipher
    });

  } catch (error) {
    console.error("Get raw OVK error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to get organization vault key"] }
    }, { status: 500 });
  }
}
