import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const vaultId = searchParams.get('id');
    const orgId = searchParams.get('org_id');

    console.log('🔐 [/api/vaults/org] Called:', { vaultId, orgId, userId: user.id });

    if (!vaultId || !orgId) {
      return NextResponse.json({ 
        error: 'Vault ID and Organization ID are required' 
      }, { status: 400 });
    }

    // Verify user is member of this org OR is the org owner
    const membership = await prisma.membership.findFirst({
      where: {
        user_id: user.id,
        org_id: orgId
      }
    });

    // Check if user is org owner (for admin accounts)
    const org = await prisma.org.findUnique({
      where: { id: orgId }
    });

    const isOrgOwner = org?.owner_user_id === user.id;

    console.log('👤 Access check:', { 
      hasMembership: !!membership, 
      isOrgOwner,
      role: membership?.role || (isOrgOwner ? 'owner' : null)
    });

    if (!membership && !isOrgOwner) {
      return NextResponse.json({ 
        error: 'You are not a member of this organization' 
      }, { status: 403 });
    }

    // Get the vault with its OrgVaultKey
    const vault = await prisma.vault.findFirst({
      where: { 
        id: vaultId,
        org_id: orgId,
        type: 'org'
      },
      include: {
        OrgVaultKey: true
      }
    });

    console.log('🗄️ Vault check:', vault ? `Found (${vault.id})` : 'Not found');

    if (!vault) {
      return NextResponse.json({ 
        error: 'Vault not found or does not belong to this organization' 
      }, { status: 404 });
    }

    // Get OVK
    let ovkWrappedForUser: string | null = null;

    if (isOrgOwner && vault.OrgVaultKey?.ovk_cipher) {
      // For org owner, use the OrgVaultKey's ovk_cipher
      ovkWrappedForUser = vault.OrgVaultKey.ovk_cipher;
      console.log('🔑 Using OrgVaultKey ovk_cipher for owner');
    } else if (membership?.ovk_wrapped_for_user) {
      // For members, use their wrapped OVK from membership
      ovkWrappedForUser = membership.ovk_wrapped_for_user;
      console.log('🔑 Using membership ovk_wrapped_for_user');
    }

    if (!ovkWrappedForUser) {
      return NextResponse.json({ 
        error: 'OVK not found for user in this organization. Please contact your administrator.' 
      }, { status: 404 });
    }

    console.log('✅ Returning OVK for user');

    return NextResponse.json({
      ovk_wrapped_for_user: ovkWrappedForUser,
      org_id: orgId
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Org vault API error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
