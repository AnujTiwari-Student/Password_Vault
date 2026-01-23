"use server";

import { getUserByEmailWithAccounts } from "@/data/users-data";
import { signIn } from "@/lib/auth";
import { send2faVerificationCode } from "@/lib/mail";
import { verifyAuthPassword } from "@/lib/password-hash";
import { LoginSchema } from "@/schema/zod-schema";
import { generateOtp } from "@/utils/generate-otp";
import { authRateLimit, AppError } from "@/lib/rate-limiter";
import { cookies, headers } from "next/headers";
import * as z from "zod";

type LoginActionState = {
  success: boolean;
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    _form?: string[];
  };
  user?: {
    id: string;
    email: string;
    umk_salt?: string;
    master_passphrase_verifier?: string | null;
  };
  requires2FA?: boolean;
};

export const login = async (data: z.infer<typeof LoginSchema>): Promise<LoginActionState> => {
  try {
    const headersList = await headers();
    const clientIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    
    // const rateLimitKey = `${data.email}:${clientIP}`;
    // authRateLimit(rateLimitKey);

    const validatedFields = LoginSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await getUserByEmailWithAccounts(email);
    if (!existingUser) {
      return {
        success: false,
        errors: {
          email: ["No user found with this email"],
        },
      };
    }

    if (!existingUser.auth_hash && existingUser.accounts && existingUser.accounts.length > 0) {
      const providers = existingUser.accounts
        .map((acc: { provider: string }) => acc.provider)
        .filter((p: string) => p === 'google' || p === 'github')
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' or ');

      return {
        success: false,
        errors: {
          _form: [`This email is linked with ${providers}. Please use ${providers} to login.`],
        },
      };
    }

    const matchPassword = await verifyAuthPassword(existingUser.auth_hash!, password);
    if (!matchPassword) {
      return {
        success: false,
        errors: {
          password: ["Incorrect password"],
        },
      };
    }

    if (existingUser.twofa_enabled === true) {
      const cookieStore = await cookies();
      cookieStore.set("temp_2fa_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60,
      });
      
      const otp = await generateOtp(existingUser.email!, existingUser.id!.toString());
      await send2faVerificationCode(existingUser.email, otp);
      return {
        success: true,
        message: "2FA code sent to email",
        requires2FA: true,
        user: {
          id: existingUser.id!.toString(),
          email: existingUser.email,
        },
      };
    }

    const signinResult = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (signinResult?.error) {
      return {
        success: false,
        errors: {
          _form: [signinResult.error || "Login failed. Please try again."],
        },
      };
    }

    return {
      success: true,
      message: "Login successful",
      user: {
        id: existingUser.id!.toString(),
        email: existingUser.email,
      },
    };

  } catch (error) {
    if (error instanceof AppError && error.statusCode === 429) {
      return {
        success: false,
        errors: {
          _form: [error.message],
        },
      };
    }

    return {
      success: false,
      errors: {
        _form: ["An unexpected error occurred. Please try again."],
      },
    };
  }
};
