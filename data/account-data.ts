import { prisma } from "@/db";


export const getAccountByUserId = async (userId: string) => {
    try {
        const account =  await prisma.account.findFirst({
            where: { userId }
        });
        return account;
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw new Error("Error fetching account by user ID");
    }
}