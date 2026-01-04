import { signIn } from "next-auth/react";


export const click = (provider: "google" | "github" | "discord" | "figma") => {
    signIn(provider, {
        callbackUrl: `${window.location.origin}/dashboard`,
    }).catch((error) => {
        console.error("Error during sign-in:", error);
    });
};