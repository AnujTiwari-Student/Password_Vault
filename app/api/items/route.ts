import { prisma } from '@/db';
import { currentUser } from '@/lib/current-user';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch items from a vault
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const vaultId = searchParams.get('id');

    if (!vaultId) {
      return NextResponse.json({ 
        message: 'Vault ID is required' 
      }, { status: 400 });
    }

    // Check if user owns this vault
    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: {
        user_id: true,
        type: true
      }
    });

    if (!vault) {
      return NextResponse.json({ 
        message: 'Vault not found' 
      }, { status: 404 });
    }

    if (vault.type === 'personal' && vault.user_id !== user.id) {
      return NextResponse.json({ 
        message: 'Not a personal vault' 
      }, { status: 400 });
    }

    // Fetch items
    const items = await prisma.item.findMany({
      where: { vault_id: vaultId },
      orderBy: { updated_at: 'desc' }
    });

    return NextResponse.json({ items }, { status: 200 });

  } catch (error) {
    console.error('Items GET error:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// POST - Create a new item
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      vaultId,
      item_name,
      item_url,
      type,
      tags,
      item_key_wrapped,
      username_ct,
      password_ct,
      totp_seed_ct,
      notes_ct,
      created_by
    } = body;

    // Validate required fields
    if (!vaultId || !item_name || !type || !Array.isArray(type) || type.length === 0) {
      return NextResponse.json({ 
        message: 'Missing required fields: vaultId, item_name, type' 
      }, { status: 400 });
    }

    if (!item_key_wrapped) {
      return NextResponse.json({ 
        message: 'item_key_wrapped is required' 
      }, { status: 400 });
    }

    // Verify vault exists and user has access
    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: {
        id: true,
        type: true,
        user_id: true,
        org_id: true
      }
    });

    if (!vault) {
      return NextResponse.json({ 
        message: 'Vault not found' 
      }, { status: 404 });
    }

    // Check permissions
    if (vault.type === 'personal') {
      if (vault.user_id !== user.id) {
        return NextResponse.json({ 
          message: 'Access denied: Not your personal vault' 
        }, { status: 403 });
      }
    } else if (vault.type === 'org') {
      // Check if user is member of this org
      const membership = await prisma.membership.findFirst({
        where: {
          user_id: user.id,
          org_id: vault.org_id!
        }
      });

      if (!membership) {
        return NextResponse.json({ 
          message: 'Access denied: Not a member of this organization' 
        }, { status: 403 });
      }

      // Check if user has permission to create items (editor or owner)
      if (membership.role === 'viewer') {
        return NextResponse.json({ 
          message: 'Access denied: Viewers cannot create items' 
        }, { status: 403 });
      }
    }

    // Create the item
    const newItem = await prisma.item.create({
      data: {
        vault_id: vaultId,
        name: item_name,
        url: item_url || null,
        type: type,
        tags: tags || [],
        item_key_wrapped: item_key_wrapped,
        username_ct: username_ct || null,
        password_ct: password_ct || null,
        totp_seed_ct: totp_seed_ct || null,
        note_ct: notes_ct || null,
        created_by: created_by || user.id,
        updated_at: new Date(),
      }
    });

    console.log('✅ Item created successfully:', newItem.id);

    return NextResponse.json({ 
      message: 'Item created successfully',
      item: newItem 
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Items POST error:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// PUT - Update an item
export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      itemId,
      item_name,
      item_url,
      type,
      tags,
      username_ct,
      password_ct,
      totp_seed_ct,
      notes_ct,
    } = body;

    if (!itemId) {
      return NextResponse.json({ 
        message: 'Item ID is required' 
      }, { status: 400 });
    }

    // Get item with vault info
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        vault: {
          select: {
            type: true,
            user_id: true,
            org_id: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ 
        message: 'Item not found' 
      }, { status: 404 });
    }

    // Check permissions
    if (item.vault.type === 'personal') {
      if (item.vault.user_id !== user.id) {
        return NextResponse.json({ 
          message: 'Access denied' 
        }, { status: 403 });
      }
    } else if (item.vault.type === 'org') {
      const membership = await prisma.membership.findFirst({
        where: {
          user_id: user.id,
          org_id: item.vault.org_id!
        }
      });

      if (!membership || membership.role === 'viewer') {
        return NextResponse.json({ 
          message: 'Access denied' 
        }, { status: 403 });
      }
    }

    // Update item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name: item_name,
        url: item_url,
        type: type,
        tags: tags,
        username_ct: username_ct,
        password_ct: password_ct,
        totp_seed_ct: totp_seed_ct,
        note_ct: notes_ct,
        updated_at: new Date(),
      }
    });

    return NextResponse.json({ 
      message: 'Item updated successfully',
      item: updatedItem 
    }, { status: 200 });

  } catch (error) {
    console.error('Items PUT error:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete an item
export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ 
        message: 'Item ID is required' 
      }, { status: 400 });
    }

    // Get item with vault info
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        vault: {
          select: {
            type: true,
            user_id: true,
            org_id: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ 
        message: 'Item not found' 
      }, { status: 404 });
    }

    // Check permissions
    if (item.vault.type === 'personal') {
      if (item.vault.user_id !== user.id) {
        return NextResponse.json({ 
          message: 'Access denied' 
        }, { status: 403 });
      }
    } else if (item.vault.type === 'org') {
      const membership = await prisma.membership.findFirst({
        where: {
          user_id: user.id,
          org_id: item.vault.org_id!
        }
      });

      if (!membership || membership.role === 'viewer') {
        return NextResponse.json({ 
          message: 'Access denied' 
        }, { status: 403 });
      }
    }

    // Delete item
    await prisma.item.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ 
      message: 'Item deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Items DELETE error:', error);
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
