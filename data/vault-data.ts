import { prisma } from "@/db";

export const getVaultByUserId = async (userId: string) => {
    return prisma.vault.findFirst({
        where: { user_id: userId }
    });
}

export const getVaultByOrgId = async (orgId: string) => {
    return prisma.vault.findFirst({
        where: { org_id: orgId }
    });
}

export const getOrgVaultForUser = async (userId: string) => {
    const membership = await prisma.membership.findFirst({
        where: { user_id: userId },
        include: {
            org: {
                include: {
                    vaults: {
                        where: { type: 'org' },
                        take: 1
                    }
                }
            }
        }
    });

    return membership?.org?.vaults?.[0] || null;
}

export const checkOrgVaultAccess = async (userId: string, orgId: string) => {
    const membership = await prisma.membership.findFirst({
        where: {
            user_id: userId,
            org_id: orgId
        },
        select: {
            role: true,
            org_id: true
        }
    });

    return membership;
}

export async function checkOrgVaultAccessPermissions(userId: string, orgId: string): Promise<boolean> {
    const membership = await prisma.membership.findFirst({
        where: {
            org_id: orgId,
            user_id: userId
        },
        select: {
            role: true
        }
    });

    if (!membership) {
        return false;
    }

    return ['owner', 'admin', 'member', 'viewer'].includes(membership.role);
}


