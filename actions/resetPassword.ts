"use server"

import { prisma } from "@/db"
import { redis } from "@/serverless"
import { z } from "zod"
import { hashAuthPassword } from "@/lib/password-hash"  // ✅ Your Argon2 utility
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
})

export async function resetPassword(
  prevState: { error?: string; success?: boolean; pending?: boolean } | undefined,
  formData: FormData
) {
  let email = ""
  
  try {
    const cookieStore = await cookies()
    email = cookieStore.get('reset-email')?.value || ""
    
    if (!email) {
      return { error: "Session expired. Please start over.", pending: false }
    }

    const validatedFields = resetPasswordSchema.safeParse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors.password?.[0] ||
               validatedFields.error.flatten().fieldErrors.confirmPassword?.[0] ||
               "Invalid form data",
        pending: false
      }
    }

    const { password, confirmPassword } = validatedFields.data

    if (password !== confirmPassword) {
      return { error: "Passwords do not match", pending: false }
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { error: "User not found", pending: false }
    }

    const hashedPassword = await hashAuthPassword(password)

    await prisma.user.update({
      where: { email },
      data: { 
        auth_hash: hashedPassword
      }
    })

    await prisma.logs.create({
      data: {
        user_id: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        subject_type: "password",
        ip: cookieStore.get('client-ip')?.value || null,
        ua: cookieStore.get('user-agent')?.value || null,
        meta: {
          password_length: password.length,
          reset_method: "email_otp_flow",
          hash_algorithm: "argon2id"
        }
      }
    })

    console.log(`✅ Password reset successful for user: ${user.id} (${email})`)
    console.log(`🔒 Argon2 hash generated with memoryCost: 65536, timeCost: 3`)
    
    await redis.del(`otp:${email}`)
    cookieStore.delete('reset-email')
    
  } catch (error) {
    console.error('❌ Reset password error:', error)
    return { error: "An unexpected error occurred. Please try again.", pending: false }
  }

  redirect('/auth/login')
}
