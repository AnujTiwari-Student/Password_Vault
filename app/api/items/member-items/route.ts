import { prisma } from '@/db';
import { currentUser } from '@/lib/current-user';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type ItemType = 'login' | 'note' | 'totp';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const vaultId = searchParams.get('vault_id');
    const orgId = searchParams.get('org_id');

    if (!vaultId || !orgId) {
      return NextResponse.json({ 
        message: 'Vault ID and Organization ID are required' 
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
      select: {
        owner_user_id: true,
        name: true
      }
    });

    const isOrgOwner = org?.owner_user_id === user.id;

    if (!membership && !isOrgOwner) {
      return NextResponse.json({ 
        message: 'You are not a member of this organization' 
      }, { status: 403 });
    }

    const vault = await prisma.vault.findFirst({
      where: { 
        id: vaultId,
        org_id: orgId,
        type: 'org'
      }
    });

    if (!vault) {
      return NextResponse.json({ 
        message: 'Vault not found or does not belong to this organization' 
      }, { status: 404 });
    }

    const searchQuery = searchParams.get('q');
    const typeFilter = searchParams.get('type');
    const tagFilter = searchParams.get('tag');

    const whereClause: Prisma.ItemWhereInput = { 
      vault_id: vaultId 
    };

    if (searchQuery) {
      whereClause.OR = [
        { 
          name: { 
            contains: searchQuery, 
            mode: 'insensitive' 
          } 
        },
        { 
          tags: { 
            hasSome: [searchQuery] 
          } 
        }
      ];
    }

    if (typeFilter && ['login', 'note', 'totp'].includes(typeFilter)) {
      whereClause.type = { 
        hasSome: [typeFilter as ItemType]
      };
    }

    if (tagFilter) {
      whereClause.tags = { 
        hasSome: [tagFilter]
      };
    }

    const items = await prisma.item.findMany({ 
      where: whereClause,
      select: { 
        id: true, 
        name: true, 
        url: true, 
        type: true, 
        tags: true, 
        item_key_wrapped: true,
        username_ct: true,
        password_ct: true,
        totp_seed_ct: true,
        note_ct: true,
        updated_at: true,
        vault_id: true,
        created_by: true,
      },
      orderBy: { updated_at: 'desc' }
    });

    return NextResponse.json({
      items,
      count: items.length,
      vault_id: vault.id,
      vault_name: vault.name || org?.name,
      vault_type: 'org',
      user_role: membership?.role || 'owner',
      org_id: vault.org_id,
      org_name: org?.name,
      filters_applied: {
        search: searchQuery,
        type: typeFilter,
        tag: tagFilter
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}