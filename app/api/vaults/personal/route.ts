import { NextRequest, NextResponse } from "next/server";
import { getUserOvkCypherKey } from "@/data/cyper-key-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  console.log("API hit for user vault key:", userId);

  if (!userId) {
    return NextResponse.json({ error: "Invalid orgId type", status: 400 }, { status: 400 });
  }

  try {
    const personalVaultKey = await getUserOvkCypherKey(userId);
    if (!personalVaultKey) {
      console.warn(`❌ Org vault key not found for orgId: ${userId}`);
      return NextResponse.json({ error: "Org vault key not found", status: 404 }, { status: 404 });
    }

    console.log("✅ orgVaultKey found:", personalVaultKey);
    return NextResponse.json({ ovk_cipher: personalVaultKey.ovk_cipher });
  } catch (error) {
    console.error("💥 Error fetching org vault key:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching org vault key", status: 500 },
      { status: 500 }
    );
  }
}
