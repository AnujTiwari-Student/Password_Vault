import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { invitation_id } = await request.json();

    if (!invitation_id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Missing invitation_id"] }
      }, { status: 400 });
    }

    const invitation = await prisma.invite.findFirst({
      where: {
        id: invitation_id,
        email: session.user.email,
        status: 'pending'
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

    if (!invitation) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Invitation not found or already processed"] }
      }, { status: 400 });
    }

    await prisma.invite.update({
      where: { id: invitation_id },
      data: { status: 'rejected' }
    });

    return NextResponse.json({
      success: true,
      message: `Invitation to ${invitation.org.name} has been rejected`
    });

  } catch (error) {
    console.error("Reject invitation error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to reject invitation"] }
    }, { status: 500 });
  }
}
