"use server";

import { getUserByEmail } from "@/data/users-data";
import { signIn } from "@/lib/auth";
import { verifyOtp } from "@/utils/generate-otp";
import { twoFALimit, AppError } from "@/lib/rate-limiter";
import { cookies, headers } from "next/headers";

type Verify2FAState = {
  success: boolean;
  message?: string;
  error?: string;
};

interface VerifyOtpParams {
  email: string;
  code: string;
}

export const verify2faCode = async ({
  email,
  code,
}: VerifyOtpParams): Promise<Verify2FAState> => {
  try {
    const headersList = await headers();
    const clientIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitKey = `${email}:${clientIP}`;
    twoFALimit(rateLimitKey);

    const cookieStore = await cookies();
    const tempEmail = cookieStore.get("temp_2fa_email")?.value;

    if (!tempEmail || tempEmail !== email) {
      return {
        success: false,
        error: "Invalid session. Please login again."
      };
    }

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return {
        success: false,
        error: "Please enter a valid 6-digit code"
      };
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }

    const otpData = await verifyOtp(code);

    if (!otpData || otpData.email !== email || otpData.userId !== user.id!.toString()) {
      return {
        success: false,
        error: "Invalid or expired code"
      };
    }

    const signinResult = await signIn("credentials", {
      redirect: false,
      email,
      password: "",
      skipPasswordCheck: "true",
    });

    if (signinResult?.error) {
      return {
        success: false,
        error: "Sign in failed after verification"
      };
    }

    const cookieStoreForDelete = await cookies();
    cookieStoreForDelete.delete("temp_2fa_email");

    return {
      success: true,
      message: "Login successful"
    };

  } catch (error) {
    if (error instanceof AppError && error.statusCode === 429) {
      return {
        success: false,
        error: error.message
      };
    }

    console.error("2FA verification error:", error);
    return {
      success: false,
      error: "Verification failed"
    };
  }
};
