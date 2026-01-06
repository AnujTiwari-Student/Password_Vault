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

export async function DELETE(request: NextRequest): Promise<NextResponse<APIResponse>> {
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

    const membershipToDelete = await prisma.membership.findUnique({
      where: { id: memberId },
    });

    if (!membershipToDelete) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Member not found"] }
      }, { status: 404 });
    }

    const org = await prisma.org.findUnique({
      where: { id: membershipToDelete.org_id },
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
        org_id: membershipToDelete.org_id,
      },
    });

    const isOrgOwner = org.owner_user_id === session.user.id;
    const isAdmin = requestingUserMembership?.role === "admin";
    const isSelf = membershipToDelete.user_id === session.user.id;

    if (!isOrgOwner && !isAdmin && !isSelf) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Insufficient permissions to remove this member"] }
      }, { status: 403 });
    }

    if (membershipToDelete.role === "owner" && !isSelf) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Cannot remove organization owner"] }
      }, { status: 403 });
    }

    await prisma.membership.delete({
      where: { id: memberId },
    });

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "MEMBER_REMOVED",
        subject_type: "MEMBERSHIP",
        meta: {
          removed_user_id: membershipToDelete.user_id,
          org_id: membershipToDelete.org_id,
          removed_by: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully"
    });

  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Failed to remove member"] }
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
