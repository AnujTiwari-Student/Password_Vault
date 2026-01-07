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

export async function sendOtp(prevState: { error?: string; pending?: boolean } | undefined, formData: FormData) {
  let email = ""
  
  try {
    const validatedFields = sendOtpSchema.safeParse({
      email: formData.get('email')
    })

    if (!validatedFields.success) {
      return { error: "Invalid email address", pending: false }
    }

    email = validatedFields.data.email
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000

    const user = await prisma.user.findUnique({
      where: { email }
    })

    await redis.set(`otp:${email}`, { otp, expiresAt }, { ex: 600 })
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
    
    if (user) {
      await prisma.logs.create({
        data: {
          user_id: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          subject_type: "password",
          ip: cookieStore.get('client-ip')?.value || null,
          ua: cookieStore.get('user-agent')?.value || null,
          meta: {
            method: "email_otp",
            otp_length: 6,
            otp_expires_in_minutes: 10
          }
        }
      })
    }

    console.log(`✅ OTP sent to: ${email}`)
    
  } catch (error) {
    console.error('❌ Send OTP error:', error)
    return { error: "Failed to send OTP", pending: false }
  }

  redirect('/auth/reset/verify')
}
