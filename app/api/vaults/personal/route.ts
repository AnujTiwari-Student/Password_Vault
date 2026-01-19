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

    if (!vaultId) {
      return NextResponse.json({ 
        error: 'Vault ID is required' 
      }, { status: 400 });
    }

    const vault = await prisma.vault.findFirst({
      where: {
        id: vaultId,
      },
      include: {
        personalVaultKey: {
          select: {
            ovk_cipher: true
          }
        }
      }
    });

    if (!vault) {
      return NextResponse.json({ 
        error: 'Vault not found' 
      }, { status: 404 });
    }

    if (vault.type !== 'personal') {
      return NextResponse.json({ 
        error: `This vault is not a personal vault (type: ${vault.type})` 
      }, { status: 400 });
    }

    if (vault.created_by !== user.id) {
      return NextResponse.json({ 
        error: 'You do not own this personal vault' 
      }, { status: 403 });
    }

    if (!vault.personalVaultKey?.ovk_cipher) {
      return NextResponse.json({ 
        error: 'Personal vault OVK not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      ovk_cipher: vault.personalVaultKey.ovk_cipher,
      vault_id: vault.id,
      vault_name: vault.name
    }, { status: 200 });

  } catch (error) {
    console.error('Personal vault fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}