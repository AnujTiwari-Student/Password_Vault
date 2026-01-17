import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { APIResponse } from "@/types/api-responses";

interface MemberActivity {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  description: string;
}

interface MemberActivityResponse {
  activities: MemberActivity[];
}

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<MemberActivityResponse>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const membershipId = searchParams.get('membership_id');

    if (!membershipId) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Membership ID is required"] }
      }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        org: {
          select: {
            id: true,
            owner_user_id: true
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Membership not found"] }
      }, { status: 404 });
    }

    const requestorMembership = await prisma.membership.findFirst({
      where: {
        user_id: session.user.id,
        org_id: membership.org_id,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!requestorMembership && membership.org.owner_user_id !== session.user.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Insufficient permissions"] }
      }, { status: 403 });
    }

    let formattedActivities: MemberActivity[] = [];

    try {
        // @ts-expect-error Raw query result
      const auditTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit'
        );
      `;

      if (auditTableExists) {
        const activities = await prisma.audit.findMany({
          where: {
            actor_user_id: membership.user_id,
            org_id: membership.org_id
          },
          orderBy: {
            // @ts-expect-error Raw query result
            created_at: 'desc'
          },
          take: 10,
          select: {
            id: true,
            action: true,
            // @ts-expect-error Raw query result
            created_at: true,
            ip: true
          }
        }).catch(() => []);

        const actionDescriptions: Record<string, string> = {
          'USER_LOGIN': 'Logged into the system',
          'ITEM_ACCESSED': 'Accessed a vault item',
          'ITEM_CREATED': 'Created a new item',
          'ITEM_UPDATED': 'Updated an item',
          'ITEM_DELETED': 'Deleted an item',
          'INVITE_ACCEPTED': 'Accepted organization invitation',
          'ROLE_CHANGED': 'Role was changed',
          'TEAM_JOINED': 'Joined a team',
          'TEAM_LEFT': 'Left a team',
          'MEMBER_ADDED': 'New member was added',
          'MEMBER_REMOVED': 'Member was removed'
        };

        formattedActivities = activities.map(activity => ({
          id: activity.id,
          action: activity.action,
        //   @ts-expect-error Raw query result
          timestamp: activity.created_at.toISOString(),
          ip: activity.ip || 'Unknown',
          description: actionDescriptions[activity.action] || activity.action
        }));
      }
    } catch (error) {
      console.log("Could not fetch audit records, returning empty activities", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        activities: formattedActivities
      }
    });

  } catch (error) {
    console.error("Get member activity error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to fetch member activity"] }
    }, { status: 500 });
  }
}