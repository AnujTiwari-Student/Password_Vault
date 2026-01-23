import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { APIResponse, InviteResponse } from "@/types/api-responses";
import { auth } from "@/lib/auth";
import * as z from "zod";
import { Prisma } from "@prisma/client"; // Import Prisma types

const PLAN_MEMBER_LIMITS = {
  free: 5,
  basic: 5,
  professional: 20,
  enterprise: 50,
} as const;

type PlanType = keyof typeof PLAN_MEMBER_LIMITS;

const InviteSchema = z.object({
  org_id: z.string().min(1, "Organization ID is required"),
  email: z.string().email("Invalid email address"),
  // @ts-expect-error Type 'string' is not assignable to type '"member" | "admin" | "viewer" | "owner"'.
  role: z.enum(["member", "admin", "viewer", "owner"], {
    errorMap: () => ({ message: "Invalid role" })
  }),
});

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<InviteResponse>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized. Please log in."] }
      }, { status: 401 });
    }

    const data = await request.json();
    
    const validationResult = InviteSchema.safeParse(data);
    if (!validationResult.success) {
      // @ts-expect-error Type 'ZodError' is not assignable to type 'string'.
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({
        success: false,
        errors: { _form: [errors] }
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    const userMembership = await prisma.membership.findFirst({
      where: {
        user_id: session.user.id,
        org_id: validatedData.org_id,
        role: { in: ['owner', 'admin'] }
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            owner_user_id: true
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Organization not found or you don't have permission to invite members. Only owners and admins can invite members."] }
      }, { status: 403 });
    }

    const ownerId = userMembership.org.owner_user_id;

    const ownerUser = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan_type: true }
    });

    const ownerPlan = (ownerUser?.plan_type as PlanType) || 'free';
    const memberLimit = PLAN_MEMBER_LIMITS[ownerPlan] || 5;

    const ownedOrgs = await prisma.org.findMany({
      where: { owner_user_id: ownerId },
      select: { id: true }
    });
    
    const ownedOrgIds = ownedOrgs.map(o => o.id);

    const currentTotalMembers = await prisma.membership.count({
      where: {
        org_id: { in: ownedOrgIds },
        user_id: { not: ownerId }
      }
    });

    if (currentTotalMembers >= memberLimit) {
      return NextResponse.json({
        success: false,
        errors: { 
          _form: [`Member limit exceeded. The organization owner (${ownerPlan} plan) is limited to ${memberLimit} members (excluding themselves). Please upgrade the plan to invite more users.`] 
        }
      }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true }
    });

    if (existingUser) {
      const existingMembership = await prisma.membership.findFirst({
        where: { 
          org_id: validatedData.org_id,
          user_id: existingUser.id
        }
      });

      if (existingMembership) {
        return NextResponse.json({
          success: false,
          errors: { _form: [`This user is already a member of ${userMembership.org.name}`] }
        }, { status: 400 });
      }
    }

    const existingInvitation = await prisma.invite.findFirst({
      where: {
        org_id: validatedData.org_id,
        email: validatedData.email,
        status: 'pending',
        expires_at: { gt: new Date() } 
      }
    });

    if (existingInvitation) {
      return NextResponse.json({
        success: false,
        errors: { _form: [`An invitation has already been sent to ${validatedData.email} for ${userMembership.org.name}`] }
      }, { status: 400 });
    }

    const invitation = await prisma.invite.create({
      data: {
        org_id: validatedData.org_id,
        email: validatedData.email.toLowerCase().trim(),
        role: validatedData.role,
        invited_by: session.user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
      }
    });

    // @ts-expect-error Type '"member" | "admin" | "viewer" | "owner"' is not assignable to type '"member" | "admin" | "viewer"'.
    return NextResponse.json({
      success: true,
      message: `Invitation sent successfully to ${validatedData.email}`,
      data: {
        invitation: {
          id: invitation.id,
          team_id: validatedData.org_id,
          email: invitation.email,
          role: invitation.role as 'member' | 'admin' | 'viewer',
          status: 'pending' as const,
          invited_by: invitation.invited_by,
          invited_at: invitation.created_at.toISOString(),
          expires_at: invitation.expires_at.toISOString()
        }
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("Invite error:", error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          success: false,
          errors: { _form: ["An invitation for this email already exists in this organization"] }
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Internal server error. Please try again."] }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('org_id');
    const type = searchParams.get('type');

    // FIX: Using strict Prisma type instead of 'any'
    const whereClause: Prisma.InviteWhereInput = {};

    // 1. Specific Org ID provided
    if (orgId) {
      const canViewInvites = await prisma.membership.findFirst({
        where: {
          user_id: session.user.id,
          org_id: orgId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!canViewInvites) {
        return NextResponse.json({
          success: false,
          errors: { _form: ["Insufficient permissions to view organization invitations"] }
        }, { status: 403 });
      }

      whereClause.org_id = orgId;
      
      if (!type || type !== 'history') {
         whereClause.status = 'pending';
         whereClause.expires_at = { gt: new Date() };
      }
    } 
    // 2. Global View (Dashboard)
    else {
      if (type === 'sent') {
        const managedOrgs = await prisma.membership.findMany({
          where: {
            user_id: session.user.id,
            role: { in: ['owner', 'admin'] }
          },
          select: { org_id: true }
        });
        
        const managedOrgIds = managedOrgs.map(m => m.org_id);
        whereClause.org_id = { in: managedOrgIds };
      } else {
        whereClause.email = session.user.email;
        whereClause.status = 'pending';
        whereClause.expires_at = { gt: new Date() };
      }
    }

    const invitations = await prisma.invite.findMany({
      where: whereClause,
      include: {
        org: {
          select: {
            id: true,
            name: true,
            owner_user_id: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const counts = {
      total: invitations.length,
      by_org: invitations.reduce((acc: Record<string, number>, invite) => {
        const oid = invite.org_id;
        acc[oid] = (acc[oid] || 0) + 1;
        return acc;
      }, {})
    };

    return NextResponse.json({
      success: true,
      data: { 
        invitations,
        counts 
      }
    });

  } catch (error: unknown) {
    console.error("Get invitations error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Internal server error"] }
    }, { status: 500 });
  }
}