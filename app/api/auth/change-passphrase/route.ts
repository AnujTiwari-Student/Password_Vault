import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { old_passphrase, new_passphrase } = body;

    if (!old_passphrase || !new_passphrase) {
      return NextResponse.json({ error: "Old and new passphrase required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { umk_salt: true, master_passphrase_verifier: true },
    });

    const memberships = await prisma.membership.findMany({
      where: { user_id: user.id },
      include: { org: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          master_passphrase_verifier: "TEMP_TRANSITION_STATE",
        },
        select: { id: true, email: true },
      });

      for (const membership of memberships) {
        await tx.audit.create({
          data: {
            org_id: membership.org_id,
            actor_user_id: user.id,
            action: "passphrase_rotation_started",
            subject_type: "membership",
            subject_id: null,
            ip: req.headers.get("x-forwarded-for") || null,
            ua: req.headers.get("user-agent") || null,
            ts: new Date(),
            meta: { membership_id: membership.id, org_name: membership.org?.name },
          },
        });
      }

      return updatedUser;
    });

    return NextResponse.json(
      {
        message: "Passphrase change initiated. Complete client-side re-encryption.",
        nextStep: "CLIENT_REENCRYPT_MEMBERSHIPS",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Passphrase change error:", error);
    return NextResponse.json({ error: "Failed to initiate passphrase change" }, { status: 500 });
  }
}

