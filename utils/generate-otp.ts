import { redis } from "@/serverless";
import { randomBytes } from "crypto";

interface StoredOtpData {
  email: string | null
  userId: string | null
  otp: string | null
}

export const generateOtp = async (email: string, userId: string) => {
  const buffer = randomBytes(3);
  const maxVal = 1_000_000;
  const num = parseInt(buffer.toString("hex"), 16) % maxVal;
  const otp = num.toString().padStart(6, "0");

  const key = `otp:${otp}`;
  const value = JSON.stringify({ email, userId });

  await redis.set(key, value, { ex: 600 });

  return otp;
};

export async function verifyOtp(otp: string) {
  const key = `otp:${otp}`
  const data = await redis.get<StoredOtpData>(key)

  if (!data) return null

  await redis.del(key);

  try {
    let parsed: StoredOtpData;

    if (typeof data === "string") {
      parsed = JSON.parse(data);
    } else if (typeof data === "object" && data.email && data.userId) {
      parsed = data;
    } else {
      return null;
    }

    return {
      email: parsed.email,
      userId: parsed.userId,
    };
  } catch (error) {
    console.error("Error parsing OTP data:", error);
    return null;
  }
}
