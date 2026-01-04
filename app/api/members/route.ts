import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { APIResponse } from "@/types/api-responses";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const teamId = searchParams.get('team_id');

    if (teamId) {
      const members = await prisma.membership.findMany({
        where: { org_id: teamId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: { members }
      });
    }

    if (orgId) {
      const members = await prisma.membership.findMany({
        where: { org_id: orgId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: { members }
      });
    }

    return NextResponse.json({
      success: false,
      errors: { _form: ["Missing org_id or team_id parameter"] }
    }, { status: 400 });

  } catch (error: unknown) {
    console.error("Members API error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Internal server error"] }
    }, { status: 500 });
  }
}
