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

    if (!vaultId || !orgId) {
      return NextResponse.json({ 
        error: 'Vault ID and Organization ID are required' 
      }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        user_id: user.id,
        org_id: orgId
      }
    });

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { owner_user_id: true }
    });

    const isOrgOwner = org?.owner_user_id === user.id;

    if (!membership && !isOrgOwner) {
      return NextResponse.json({ 
        error: 'You are not a member of this organization' 
      }, { status: 403 });
    }

    const vault = await prisma.vault.findFirst({
      where: { 
        id: vaultId,
        org_id: orgId,
        type: 'org'
      },
      include: {
        orgVaultKey: {
          select: {
            ovk_cipher: true
          }
        }
      }
    });

    if (!vault) {
      return NextResponse.json({ 
        error: 'Vault not found or does not belong to this organization' 
      }, { status: 404 });
    }

    let ovkWrappedForUser: string | null = null;
    let wrapType: 'aes' | 'rsa' = 'rsa';

    if (membership?.ovk_wrapped_for_user) {
      ovkWrappedForUser = membership.ovk_wrapped_for_user;
      wrapType = 'rsa';
    } else if (isOrgOwner && vault.orgVaultKey?.ovk_cipher) {
      ovkWrappedForUser = vault.orgVaultKey.ovk_cipher;
      wrapType = 'aes';
    }

    if (!ovkWrappedForUser) {
      return NextResponse.json({ 
        error: 'OVK not found for user in this organization' 
      }, { status: 404 });
    }

    return NextResponse.json({
      ovk_wrapped_for_user: ovkWrappedForUser,
      wrap_type: wrapType,
      org_id: orgId,
      vault_id: vault.id,
      vault_name: vault.name
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching org vault OVK:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
