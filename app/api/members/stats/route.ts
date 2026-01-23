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

    // --- STATS CALCULATION ---
    
    // 1. Login Count (Strictly counts explicit login events)
    const loginCount = await prisma.audit.count({
      where: {
        actor_user_id: membership.user_id,
        org_id: membership.org_id,
        action: 'USER_LOGIN'
      }
    });

    // 2. Last Active (Changed to find the MOST RECENT activity of ANY kind)
    const lastActivityRecord = await prisma.audit.findFirst({
      where: {
        actor_user_id: membership.user_id,
        org_id: membership.org_id,
        // Removed 'action' filter so it captures any activity (View, Edit, Login, etc.)
      },
      orderBy: {
        ts: 'desc'
      },
      select: {
        ts: true
      }
    });

    const lastLogin = lastActivityRecord ? lastActivityRecord.ts.toISOString() : null;

    // 3. Items Accessed
    const itemAccessCount = await prisma.audit.count({
      where: {
        actor_user_id: membership.user_id,
        org_id: membership.org_id,
        action: {
          in: ['ITEM_ACCESSED', 'ITEM_CREATED', 'ITEM_UPDATED']
        }
      }
    });

    // 4. Invited By Info
    let invitedByData: { name: string; email: string } | null = null;
    
    if (membership.user.email) {
      const inviteRecord = await prisma.invite.findFirst({
        where: {
          org_id: membership.org_id,
          email: membership.user.email,
          status: 'accepted'
        },
        include: {
          invitedBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      if (inviteRecord?.invitedBy) {
        invitedByData = {
          name: inviteRecord.invitedBy.name || 'Unknown',
          email: inviteRecord.invitedBy.email || 'Unknown'
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalLogins: loginCount,
        lastLogin: lastLogin, // This maps to "Last Active" in UI
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