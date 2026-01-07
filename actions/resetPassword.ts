"use server"

import { prisma } from "@/db"
import { redis } from "@/serverless"
import { z } from "zod"
import bcrypt from "bcryptjs"
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
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const cookieStore = await cookies()
    const email = cookieStore.get('reset-email')?.value
    if (!email) {
      return { error: "Session expired. Please start over." }
    }

    const validatedFields = resetPasswordSchema.safeParse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors.password?.[0] ||
               "Invalid form data"
      }
    }

    const { password, confirmPassword } = validatedFields.data

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" }
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { error: "User not found" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    await redis.del(`otp:${email}`)
    cookieStore.delete('reset-email')
    redirect('/auth/login')

  } catch (error) {
    console.error('Reset password error:', error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
