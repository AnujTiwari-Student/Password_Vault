// app/api/user/verify-passphrase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { master_passphrase_verifier } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { master_passphrase_verifier: true }
    });

    if (!user?.master_passphrase_verifier) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["User verifier not found"] }
      }, { status: 404 });
    }

    const isValid = user.master_passphrase_verifier === master_passphrase_verifier;

    return NextResponse.json({
      success: isValid,
      message: isValid ? "Passphrase verified" : "Invalid passphrase"
    });

  } catch (error) {
    console.error("Verify passphrase error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: ["Failed to verify passphrase"] }
    }, { status: 500 });
  }
}
