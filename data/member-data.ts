import { prisma } from "@/db";




export const getMemberRoles = async (userId: string) => {
    return prisma.membership.findMany({
        where: { user_id: userId },
        select: { role: true }
    });
}

export const getMemberRole = async (userId: string, orgId: string) => {
    return prisma.membership.findFirst({
        where: { user_id: userId, org_id: orgId },
        select: { role: true }
    });
}

export const getMemberByOrgId = async (orgId: string) => {
    return prisma.membership.findMany({
        where: { org_id: orgId }
    });
}

export const getMemberByUserId = async (userId: string) => {
    return prisma.membership.findMany({
        where: { user_id: userId }
    });
}

export const getMemberByOrgAndUserId = async (orgId: string, userId: string) => {
    return prisma.membership.findMany({
        where: { org_id: orgId, user_id: userId }
    });
}