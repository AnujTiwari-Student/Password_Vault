import { prisma } from "@/db";



export const getUserOvkCypherKey = async (userId: string) => {
    return prisma.personalVaultKey.findFirst({
        where: { user_id: userId }
    });
}

export const getOrgOvkCypherKey = async (orgId: string) => {
    const orgVaultKey = prisma.orgVaultKey.findFirst({
        where: { org_id: orgId }
    });
    console.log("orgVaultKey", orgVaultKey);
    return orgVaultKey;
    
}