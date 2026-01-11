import { changeMasterPassphrase } from "@/actions/change-master-passphrase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { umk_salt, master_passphrase_verifier, wrapped_private_key } = body;

    if (!umk_salt || !master_passphrase_verifier || !wrapped_private_key) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await changeMasterPassphrase(
      umk_salt,
      master_passphrase_verifier,
      wrapped_private_key
    );

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(result, { status: 400 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to change master passphrase" },
      { status: 500 }
    );
  }
}