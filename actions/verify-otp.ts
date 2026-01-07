"use server"

import { redis } from "@/serverless"
import { z } from "zod"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/db"

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
})

export async function verifyOtp(
  prevState: { error?: string; pending?: boolean } | undefined,
  formData: FormData
) {
  let email = ""
  
  try {
    const validatedFields = verifyOtpSchema.safeParse({
      otp: formData.get("otp")
    })

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors.otp?.[0] || "Invalid OTP",
        pending: false
      }
    }

    const otp = validatedFields.data.otp
    const emailRaw = await redis.get(`reset:email:${otp}`)

    if (!emailRaw) {
      return { error: "Invalid or expired OTP", pending: false }
    }

    email = emailRaw as string

    const otpData = await redis.get(`otp:${email}`)
    if (!otpData) {
      return { error: "Invalid or expired OTP", pending: false }
    }

    const { otp: storedOtp, expiresAt } = otpData as { otp: string; expiresAt: number }

    if (otp !== storedOtp || Date.now() > expiresAt) {
      await redis.del(`reset:email:${otp}`)
      return { error: "Invalid or expired OTP", pending: false }
    }

    await redis.del(`otp:${email}`, `reset:email:${otp}`)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (user) {
      await prisma.logs.create({
        data: {
          user_id: user.id,
          action: "PASSWORD_RESET_OTP_VERIFIED",
          subject_type: "password",
          ip: (await cookies()).get('client-ip')?.value || null,
          ua: (await cookies()).get('user-agent')?.value || null,
          meta: {
            otp_length: 6,
            verification_method: "email"
          }
        }
      })
    }

    const cookieStore = await cookies()
    cookieStore.set("reset-email", email, { maxAge: 1800 })
    
  } catch (error) {
    console.error("❌ Verify OTP error:", error)
    return { error: "Verification failed", pending: false }
  }

  redirect("/auth/reset/password")
}
