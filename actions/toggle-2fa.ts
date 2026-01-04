"use server"

import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export const toggle2FA = async (enabled: boolean) => {
    try {
        const user = await currentUser(); 

        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { twofa_enabled: enabled },
        });

        return { 
            success: true, 
            message: enabled 
                ? 'Two-Factor Authentication enabled successfully' 
                : 'Two-Factor Authentication disabled successfully'
        };

    } catch (error) {
        console.error("Error toggling 2FA:", error);
        return {
            success: false,
            error: "Failed to update 2FA settings"
        };
    }
}
