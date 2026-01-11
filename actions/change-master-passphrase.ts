"use server";

import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";
import { generateOtp, verifyOtp } from "@/utils/generate-otp";
import { sendEmail, emailTemplates } from "@/lib/mail";
import { headers } from "next/headers";

type SendOtpResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

type VerifyOtpResponse = {
  success: boolean;
  message?: string;
  error?: string;
  oldWrappedPrivateKey?: string | null;
  oldUmkSalt?: string | null;
};

type ChangeMasterPassphraseResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function sendChangePassphraseOtp(): Promise<SendOtpResponse> {
  try {
    const user = await currentUser();
    if (!user || !user.id || !user.email) {
      return { success: false, error: "Unauthorized" };
    }

    const otp = await generateOtp(user.email, user.id);

    const emailTemplate = emailTemplates.verification({
      userName: user.email.split('@')[0],
      title: "Change Master Passphrase",
      subtitle: "Verify your identity to continue",
      message: "You have requested to change your master passphrase. Please enter the OTP below to verify your identity. This code will expire in 10 minutes.",
      expirationMinutes: 10,
      code: otp,
      codeLabel: "Master Passphrase Change OTP",
    });

    await sendEmail(user.email, "Change Master Passphrase - Verify Identity", emailTemplate);

    return { success: true, message: "OTP sent to your email" };
  } catch {
    return { success: false, error: "Failed to send OTP" };
  }
}

export async function verifyChangePassphraseOtp(otp: string): Promise<VerifyOtpResponse> {
  try {
    const user = await currentUser();
    if (!user || !user.id || !user.email) {
      return { success: false, error: "Unauthorized" };
    }

    const otpData = await verifyOtp(otp);
    if (!otpData || otpData.email !== user.email) {
      return { success: false, error: "Invalid or expired OTP" };
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { umk_salt: true }
    });

    const privateKeyLog = await prisma.logs.findFirst({
      where: {
        user_id: user.id,
        action: "STORE_PRIVATE_KEY"
      },
      select: {
        meta: true
      },
      orderBy: {
        ts: 'desc'
      }
    });

    const wrappedPrivateKey = privateKeyLog?.meta && 
      typeof privateKeyLog.meta === 'object' && 
      'wrapped_private_key' in privateKeyLog.meta 
      ? (privateKeyLog.meta as { wrapped_private_key: string }).wrapped_private_key 
      : null;

    return { 
      success: true, 
      message: "OTP verified successfully",
      oldWrappedPrivateKey: wrappedPrivateKey,
      oldUmkSalt: userData?.umk_salt || null
    };
  } catch {
    return { success: false, error: "Failed to verify OTP" };
  }
}

export async function changeMasterPassphrase(
  umk_salt: string,
  master_passphrase_verifier: string,
  newWrappedPrivateKey: string
): Promise<ChangeMasterPassphraseResponse> {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!umk_salt || !master_passphrase_verifier || !newWrappedPrivateKey) {
      return { success: false, error: "Invalid passphrase data" };
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || null;
    const ua = headersList.get("user-agent") || null;

    const memberships = await prisma.membership.findMany({
      where: { user_id: user.id },
      include: { org: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          umk_salt,
          master_passphrase_verifier,
        },
      });

      await tx.logs.create({
        data: {
          user_id: user.id!,
          action: "STORE_PRIVATE_KEY",
          subject_type: "user",
          ip,
          ua,
          ts: new Date(),
          meta: {
            wrapped_private_key: newWrappedPrivateKey,
            reason: "master_passphrase_changed"
          }
        }
      });

      for (const membership of memberships) {
        await tx.audit.create({
          data: {
            org_id: membership.org_id,
            actor_user_id: user.id!,
            action: "passphrase_changed",
            subject_type: "member",
            subject_id: membership.id,
            ip,
            ua,
            ts: new Date(),
            meta: { 
              membership_id: membership.id, 
              org_name: membership.org?.name 
            },
          },
        });
      }
    });

    return { success: true, message: "Master passphrase changed successfully" };
  } catch {
    return { success: false, error: "Failed to change master passphrase" };
  }
}