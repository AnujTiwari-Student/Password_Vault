import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { APIResponse } from "@/types/api-responses";

interface MemberStatsResponse {
  totalLogins: number;
  lastLogin: string | null;
  itemsAccessed: number;
  invitedBy: {
    name: string;
    email: string;
  } | null;
}

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<MemberStatsResponse>>> {
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
        },
        user: {
          select: {
            id: true,
            email: true
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

    let loginCount = 0;
    let lastLogin: string | null = null;
    let itemAccessCount = 0;
    let invitedByData: { name: string; email: string } | null = null;

    try {
        // @ts-expect-error $queryRaw type issue
      const auditTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit'
        );
      `;

      if (auditTableExists) {
        loginCount = await prisma.audit.count({
          where: {
            actor_user_id: membership.user_id,
            org_id: membership.org_id,
            action: 'USER_LOGIN'
          }
        }).catch(() => 0);

        const lastLoginRecord = await prisma.audit.findFirst({
          where: {
            actor_user_id: membership.user_id,
            org_id: membership.org_id,
            action: 'USER_LOGIN'
          },
          orderBy: {
            // @ts-expect-error $queryRaw type issue
            created_at: 'desc'
          },
          select: {
            // @ts-expect-error $queryRaw type issue
            created_at: true
          }
        }).catch(() => null);

        if (lastLoginRecord) {
            // @ts-expect-error $queryRaw type issue
          lastLogin = lastLoginRecord.created_at.toISOString();
        }

        itemAccessCount = await prisma.audit.count({
          where: {
            actor_user_id: membership.user_id,
            org_id: membership.org_id,
            action: 'ITEM_ACCESSED'
          }
        }).catch(() => 0);
      }
    } catch (error) {
      console.log("Audit table not accessible, using default values", error);
    }

    try {
      const inviteRecord = await prisma.invite.findFirst({
        where: {
          org_id: membership.org_id,
          email: membership.user.email || undefined,
          status: 'accepted'
        },
        include: {
          invitedBy: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }).catch(() => null);

      if (inviteRecord?.invitedBy) {
        invitedByData = {
          name: inviteRecord.invitedBy.name || 'Unknown',
          email: inviteRecord.invitedBy.email || 'Unknown'
        };
      }
    } catch (error) {
      console.log("Could not fetch invite record", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalLogins: loginCount,
        lastLogin: lastLogin,
        itemsAccessed: itemAccessCount,
        invitedBy: invitedByData
      }
    });

  } catch (error) {
    console.error("Get member stats error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to fetch member statistics"] }
      }, { status: 500 });
  }
}