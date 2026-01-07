"use server"

import { redis } from "@/serverless"
import { z } from "zod"
import { sendEmail } from "@/lib/mail"
import { emailTemplates } from "@/utils/email-templates"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/db"

const sendOtpSchema = z.object({
  email: z.string().email()
})

export async function sendOtp(prevState: { error?: string } | undefined, formData: FormData) {
  try {
    const validatedFields = sendOtpSchema.safeParse({
      email: formData.get('email')
    })

    if (!validatedFields.success) {
      return { error: "Invalid email address" }
    }

    const { email } = validatedFields.data
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000

    const user = await prisma.user.findUnique({
      where: { email }
    })

    await redis.set(`otp:${email}`, JSON.stringify({ otp, expiresAt }), { ex: 600 })
    await redis.set(`reset:email:${otp}`, email, { ex: 600 })

    await sendEmail(email, "Your Password Reset OTP", emailTemplates.verification({
      userName: user?.name || "User",
      title: "Password Reset Verification",
      subtitle: "Verify your identity to reset password",
      message: "Enter the 6-digit code below to continue with your password reset.",
      code: otp,
      codeLabel: "OTP Code",
      expirationMinutes: 10,
      tips: [
        "Never share your OTP with anyone",
        "OTP expires in 10 minutes",
        "Use copy button for accuracy"
      ]
    }))

    const cookieStore = await cookies()
    cookieStore.set('reset-email', email, { maxAge: 600 })
    redirect('/auth/reset/verify')

  } catch (error) {
    console.error("Error in sendOtp action:", error)
    return { error: "Failed to send OTP" }
  }
}
