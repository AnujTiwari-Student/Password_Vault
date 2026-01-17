import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { APIResponse } from "@/types/api-responses";
import { auth } from "@/lib/auth";
import { AuditSubjectType } from "@prisma/client";
import { MembersResponse } from "@/components/org/types";

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
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Organization ID is required"] }
      }, { status: 400 });
    }

    const userMembership = await prisma.membership.findFirst({
      where: {
        user_id: session.user.id,
        org_id: orgId
      }
    });

    if (!userMembership) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["You are not a member of this organization"] }
      }, { status: 403 });
    }

    const members = await prisma.membership.findMany({
      where: {
        org_id: orgId
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
      orderBy: {
        created_at: 'desc'
      }
    });

    // @ts-expect-error -- IGNORE --
    return NextResponse.json({
      success: true,
      data: { members }
    });

  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to fetch members"] }
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const membershipId = searchParams.get('id');
    const orgId = searchParams.get('org_id');

    if (!membershipId || !orgId) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Missing membership ID or organization ID"] }
      }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        org: true,
        user: {
          select: {
            id: true,
            name: true,
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
        errors: { _form: ["Insufficient permissions to remove members from this organization"] }
      }, { status: 403 });
    }

    if (membership.role === 'owner') {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Cannot remove the organization owner"] }
      }, { status: 400 });
    }

    if (membership.user_id === session.user.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["You cannot remove yourself from the organization"] }
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.delete({
        where: { id: membershipId }
      });

      await tx.audit.create({
        // @ts-expect-error -- IGNORE --
        data: {
          org_id: membership.org_id,
          actor_user_id: session.user.id,
          action: 'MEMBER_REMOVED',
          subject_type: 'member' as AuditSubjectType,
          subject_id: membership.user_id,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          ua: request.headers.get("user-agent") || "unknown",
          meta: {
            membershipId: membershipId,
            removedUser: membership.user.name,
            removedUserEmail: membership.user.email,
            role: membership.role
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully"
    });

  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to remove member"] }
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const memberId = url.searchParams.get('id');
    
    if (!memberId) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Member ID is required"] }
      }, { status: 400 });
    }

    const { role } = await request.json();

    if (!role || !["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Invalid role"] }
      }, { status: 400 });
    }

    const membershipToUpdate = await prisma.membership.findUnique({
      where: { id: memberId },
    });

    if (!membershipToUpdate) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Member not found"] }
      }, { status: 404 });
    }

    const org = await prisma.org.findUnique({
      where: { id: membershipToUpdate.org_id },
      select: { owner_user_id: true },
    });

    if (!org) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Organization not found"] }
      }, { status: 404 });
    }

    const requestingUserMembership = await prisma.membership.findFirst({
      where: {
        user_id: session.user.id,
        org_id: membershipToUpdate.org_id,
      },
    });

    const isOrgOwner = org.owner_user_id === session.user.id;
    const isAdmin = requestingUserMembership?.role === "admin";

    if (!isOrgOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Insufficient permissions to change roles"] }
      }, { status: 403 });
    }

    if (membershipToUpdate.role === "owner") {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Cannot change owner role"] }
      }, { status: 403 });
    }

    await prisma.membership.update({
      where: { id: memberId },
      data: { role },
    });

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "MEMBER_ROLE_CHANGED",
        subject_type: "MEMBERSHIP",
        meta: {
          target_user_id: membershipToUpdate.user_id,
          org_id: membershipToUpdate.org_id,
          old_role: membershipToUpdate.role,
          new_role: role,
          changed_by: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully"
    });

  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Failed to update role"] }
    }, { status: 500 });
  }
}
