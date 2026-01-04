"use server";

import { getUserByEmail } from "@/data/users-data";
import { prisma } from "@/db";
import { hashAuthPassword } from "@/lib/password-hash";
import { RegisterSchema } from "@/schema/zod-schema";
import { getNameFromEmail } from "@/utils/get-name";
import { registrationRateLimit, AppError } from "@/lib/rate-limiter";
import { headers } from "next/headers";
import * as z from "zod";

type RegisterActionState = {
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
    name: string | null;
  };
};

export const register = async (
  data: z.infer<typeof RegisterSchema>
): Promise<RegisterActionState> => {
  try {
    const headersList = await headers();
    const clientIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitKey = `${data.email}:${clientIP}`;
    registrationRateLimit(rateLimitKey);

    const validatedFields = RegisterSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password, confirmPassword } = validatedFields.data;

    if (password !== confirmPassword) {
      return {
        success: false,
        errors: {
          confirmPassword: ["Passwords do not match"],
        },
      };
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        errors: {
          email: ["User with this email already exists"],
        },
      };
    }

    const hashedPassword = await hashAuthPassword(password);

    if (!hashedPassword) {
      return {
        success: false,
        errors: {
          _form: ["An unexpected error occurred. Please try again later."],
        },
      };
    }

    const username = getNameFromEmail(email);

    const newUser = await prisma.user.create({
      data: {
        email,
        auth_hash: hashedPassword,
        auth_provider: "credentials",
        name: username,
        image: null,
        umk_salt: null,
        master_passphrase_verifier: null,
        twofa_enabled: false,
        email_verified: null,
        public_key: null,
        last_login: null,
        account_type: "personal",
      },
    });

    return {
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id!.toString(),
        email: newUser.email,
        name: newUser.name,
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
        _form: ["An unexpected error occurred. Please try again later."],
      },
    };
  }
};
