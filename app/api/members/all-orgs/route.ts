import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { APIResponse } from "@/types/api-responses";

interface MembersResponse {
  members: Array<{
    id: string;
    user_id: string;
    org_id: string;
    role: string;
    created_at: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
    org: {
      id: string;
      name: string;
      owner_user_id: string;
    };
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<MembersResponse>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('user_id');

    if (!userId || userId !== session.user.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Invalid user ID"] }
      }, { status: 400 });
    }

    const userMemberships = await prisma.membership.findMany({
      where: {
        user_id: userId,
        role: { in: ['owner', 'admin'] }
      },
      select: {
        org_id: true
      }
    });

    const orgIds = userMemberships.map(m => m.org_id);

    if (orgIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { members: [] }
      });
    }

    const members = await prisma.membership.findMany({
      where: {
        org_id: { in: orgIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        org: {
          select: {
            id: true,
            name: true,
            owner_user_id: true
          }
        }
      },
      orderBy: [
        { org_id: 'asc' },
        { created_at: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: { members }
    });

  } catch (error) {
    console.error("Get all org members error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to fetch members"] }
    }, { status: 500 });
  }
}