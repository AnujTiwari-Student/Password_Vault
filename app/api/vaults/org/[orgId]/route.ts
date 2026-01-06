import { prisma } from '@/db';
import { currentUser } from '@/lib/current-user';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { orgId } = params;

    console.log('🔐 [/api/vaults/org/[orgId]] Called:', { orgId, userId: user.id });

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
        message: 'You are not a member of this organization' 
      }, { status: 403 });
    }

    const vault = await prisma.vault.findFirst({
      where: {
        org_id: orgId,
        type: 'org'
      },
      select: {
        id: true,
        name: true,
        type: true,
        org_id: true,
        ovk_id: true
      }
    });

    if (!vault) {
      return NextResponse.json({ 
        message: 'Organization vault not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      vault,
      membership: {
        role: membership?.role || (isOrgOwner ? 'owner' : null)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Org vault fetch error:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
