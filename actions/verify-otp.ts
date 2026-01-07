"use server"

import { redis } from "@/serverless"
import { z } from "zod"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
})

export async function verifyOtp(prevState: { error?: string } | undefined, formData: FormData) {
  try {
    const validatedFields = verifyOtpSchema.safeParse({
      otp: formData.get('otp')
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.flatten().fieldErrors.otp?.[0] || "Invalid OTP" }
    }

    const otp = validatedFields.data.otp
    const email = await redis.get(`reset:email:${otp}`)

    if (!email) {
      return { error: "Invalid or expired OTP" }
    }

    const otpData = await redis.get(`otp:${email}`) as string
    const { otp: storedOtp, expiresAt } = JSON.parse(otpData)

    if (otp !== storedOtp || Date.now() > expiresAt) {
      await redis.del(`reset:email:${otp}`)
      return { error: "Invalid or expired OTP" }
    }

    await redis.del(`otp:${email}`, `reset:email:${otp}`)
    
    const cookieStore = await cookies()
    cookieStore.set('reset-email', email as string, { maxAge: 1800 })
    redirect('/auth/reset/password')

  } catch (error) {
    console.error("Error in verifyOtp action:", error)
    return { error: "Verification failed" }
  }
}
