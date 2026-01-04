import { prisma } from '@/db';
import { currentUser } from '@/lib/current-user';
import { NextRequest, NextResponse } from 'next/server';

interface CreateOrgRequest {
  name: string;
  description?: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to create an organization'
      }, { status: 401 });
    }

    const userId = user.id;

    const body: CreateOrgRequest = await req.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Organization name is required'
      }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Organization name must be less than 100 characters'
      }, { status: 400 });
    }

    const existingOrg = await prisma.org.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingOrg) {
      return NextResponse.json({ 
        error: 'Conflict',
        message: 'An organization with this name already exists'
      }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.org.create({
        data: {
          name: name.trim(),
          owner_user_id: userId,
        }
      });

      const orgVaultKey = await tx.orgVaultKey.create({
        data: {
          org_id: organization.id,
          ovk_cipher: '',
        }
      });

      const vault = await tx.vault.create({
        data: {
          name: `${name} Vault`,
          type: 'org',
          org_id: organization.id,
          ovk_id: orgVaultKey.id,
          orgVaultKeyId: orgVaultKey.id,
        }
      });

      await tx.membership.create({
        data: {
          user_id: userId,
          org_id: organization.id,
          role: 'owner',
          ovk_wrapped_for_user: '',
        }
      });

      await tx.logs.create({
        data: {
          user_id: userId,
          action: 'ORG_CREATED',
          subject_type: 'org',
          ts: new Date(),
          meta: {
            org_id: organization.id,
            org_name: organization.name,
            vault_id: vault.id,
          }
        }
      });

      return { organization, vault };
    });

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organization: result.organization,
        vault: result.vault
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'Failed to create organization',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}