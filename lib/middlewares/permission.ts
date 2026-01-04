import { prisma } from "@/db";
import { MemberRole } from "@prisma/client";

type TargetType = 'vault' | 'item';
type Permission = 'view' | 'edit' | 'share' | 'manage' | 'decrypt';
type Role = MemberRole;

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    owner: ['view', 'edit', 'share', 'manage', "decrypt"],
    admin: ['view', 'edit', 'share', 'manage', "decrypt"],
    member: ['view', "decrypt", 'share'], 
    viewer: ['view', "decrypt"], 
};

export async function permissionCheck(
    userId: string,
    targetId: string,
    targetType: TargetType,
    requiredPerm: Permission
): Promise<boolean> {
    try {
        console.log(`Permission check: User ${userId}, Target ${targetId}, Type ${targetType}, Permission ${requiredPerm}`);
        
        let vaultId: string | null = null;
        
        if (targetType === 'item') {
            const item = await prisma.item.findUnique({ 
                where: { id: targetId },
                select: { vault_id: true }
            });
            if (!item) {
                console.log("Item not found");
                return false;
            }
            vaultId = item.vault_id;
        } else {
            vaultId = targetId;
        }

        const vault = await prisma.vault.findUnique({ 
            where: { id: vaultId },
            select: { 
                org_id: true, 
                user_id: true,
                type: true  
            }
        });
        
        if (!vault) {
            console.log("Vault not found");
            return false;
        }
        
        console.log(`Vault found - org_id: ${vault.org_id}, user_id: ${userId}, type: ${vault.type}`);
        
        if (vault.type === 'personal') {
            if (!vault.user_id) {
                console.log("Personal vault missing user_id - data inconsistency");
                return false;
            }
            
            const isOwner = vault.user_id === userId;
            console.log(`Personal vault check - isOwner: ${isOwner}`);
            return isOwner; 
        }
        
        if (vault.type === 'org') {
            if (!vault.org_id) {
                console.log("Organization vault missing org_id - data consistency error");
                return false;
            }
            
            const membership = await prisma.membership.findFirst({ 
                where: { 
                    user_id: userId, 
                    org_id: vault.org_id 
                },
                select: { role: true }
            });
            
            if (!membership) {
                console.log("No organization membership found");
                return false;
            }
            
            const userRole: Role = membership.role as Role;
            const hasPermission = ROLE_PERMISSIONS[userRole].includes(requiredPerm);
            
            console.log(`Org vault check - role: ${userRole}, hasPermission: ${hasPermission}`);
            return hasPermission;
        }
        
        if (vault.user_id && !vault.org_id) {
            const isOwner = vault.user_id === userId;
            console.log(`Fallback personal vault check - isOwner: ${isOwner}`);
            return isOwner;
        }
        
        if (vault.org_id && !vault.user_id) {
            const membership = await prisma.membership.findFirst({ 
                where: { 
                    user_id: userId, 
                    org_id: vault.org_id 
                },
                select: { role: true }
            });
            
            if (!membership) {
                console.log("No organization membership found (fallback)");
                return false;
            }
            
            const userRole: Role = membership.role as Role;
            const hasPermission = ROLE_PERMISSIONS[userRole].includes(requiredPerm);
            
            console.log(`Fallback org vault check - role: ${userRole}, hasPermission: ${hasPermission}`);
            return hasPermission;
        }
        
        console.log("Invalid vault state - unclear ownership type");
        return false;

    } catch (error) {
        console.error(`Permission check error for User ${userId}:`, error);
        return false; 
    }
}
