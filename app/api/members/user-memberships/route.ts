import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { APIResponse } from "@/types/api-responses";

interface UserMembershipsResponse {
  memberships: Array<{
    id: string;
    org_id: string;
    org_name: string;
    role: string;
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<UserMembershipsResponse>>> {
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

    if (!userId) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["User ID is required"] }
      }, { status: 400 });
    }

    const memberships = await prisma.membership.findMany({
      where: {
        user_id: userId
      },
      include: {
        org: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const formattedMemberships = memberships.map(m => ({
      id: m.id,
      org_id: m.org_id,
      org_name: m.org.name,
      role: m.role
    }));

    return NextResponse.json({
      success: true,
      data: {
        memberships: formattedMemberships
      }
    });

  } catch (error) {
    console.error("Get user memberships error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to fetch user memberships"] }
    }, { status: 500 });
  }
}