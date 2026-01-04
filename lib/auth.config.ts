import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "@/schema/zod-schema";
import { getUserByEmail } from "@/data/users-data";
import { verifyAuthPassword } from "./password-hash";
import { authRateLimit, AppError } from "./rate-limiter";

export default {
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                twoFactorVerified: { label: "2FA Verified", type: "text" },
                skipPasswordCheck: { label: "Skip Password", type: "text" },
            },
            // @ts-expect-error TS2345
            authorize: async (credentials, request) => {
                if(!credentials) {
                    console.error("No credentials provided");
                    return null
                }

                try {
                    const clientIP = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                                   request?.headers?.get('x-real-ip') || 
                                   'unknown';
                    
                    const rateLimitKey = `${credentials.email}:${clientIP}`;
                    
                    try {
                        authRateLimit(rateLimitKey);
                    } catch (error) {
                        if (error instanceof AppError && error.statusCode === 429) {
                            console.error("Rate limit exceeded for login attempt");
                            return null;
                        }
                        throw error;
                    }

                    const { twoFactorVerified, email, password, skipPasswordCheck } = credentials;
                    
                    if (twoFactorVerified === "true" || skipPasswordCheck === "true") {
                        const existingUser = await getUserByEmail(email as string);
                        
                        if (!existingUser) {
                            console.error("No user found with this email for 2FA verification");
                            return null;
                        }

                        return {
                            id: existingUser.id!.toString(),
                            email: existingUser.email,
                            name: existingUser.name,
                            image: existingUser.image,
                            masterPassphraseSetupComplete: !!existingUser.master_passphrase_verifier,
                        };
                    }
                    
                    const validated = LoginSchema.safeParse({ email, password });
                    if (!validated.success) {
                        console.error("Invalid input schema", validated.error.format());
                        return null
                    }

                    const { email: validEmail, password: validPassword } = validated.data;
                    const existingUser = await getUserByEmail(validEmail);

                    if (!existingUser) {
                        console.error("No user found with this email");
                        return null;
                    }

                    const isPasswordValid = await verifyAuthPassword(existingUser.auth_hash || "", validPassword);
                    if (!isPasswordValid) {
                        console.error("Incorrect password");
                        return null;
                    }

                    return {
                        id: existingUser.id!.toString(),
                        email: existingUser.email,
                        name: existingUser.name,
                        image: existingUser.image,
                        masterPassphraseSetupComplete: !!existingUser.master_passphrase_verifier,
                    };    

                } catch (error) {
                    console.error("Error in authorize:", error);
                    return null;
                }
            },
        }),
    ],
} satisfies NextAuthConfig;
