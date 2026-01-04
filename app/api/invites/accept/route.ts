// app/api/invites/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { invitation_id, ovk_wrapped_for_user } = await request.json();

    if (!invitation_id || !ovk_wrapped_for_user) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Missing required fields: invitation_id and ovk_wrapped_for_user"] }
      }, { status: 400 });
    }

    const invitation = await prisma.invite.findFirst({
      where: {
        id: invitation_id,
        email: session.user.email,
        status: 'pending',
        expires_at: { gt: new Date() }
      },
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
            email: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Invalid, expired, or already processed invitation"] }
      }, { status: 400 });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        org_id: invitation.org_id,
        user_id: session.user.id
      }
    });

    if (existingMembership) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["You are already a member of this organization"] }
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.create({
        data: {
          org_id: invitation.org_id!,
          user_id: session.user.id!,
          role: invitation.role,
          ovk_wrapped_for_user: ovk_wrapped_for_user 
        }
      });

      await tx.invite.update({
        where: { id: invitation_id },
        data: { status: 'accepted' }
      });

      await tx.audit.create({
        data: {
          org_id: invitation.org_id,
          actor_user_id: session.user.id!,
          action: 'INVITE_ACCEPTED',
          subject_type: 'invite',
          subject_id: invitation_id,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          ua: request.headers.get("user-agent") || "unknown",
          meta: {
            invitedByUser: invitation.invitedBy.name,
            invitedByEmail: invitation.invitedBy.email,
            role: invitation.role,
            orgName: invitation.org.name
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${invitation.org.name}!`,
      data: {
        organization: {
          id: invitation.org.id,
          name: invitation.org.name,
          role: invitation.role
        }
      }
    });

  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to accept invitation. Please try again."] }
    }, { status: 500 });
  }
}
