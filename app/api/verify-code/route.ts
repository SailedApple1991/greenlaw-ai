import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { valid: false, error: "Code is required" },
      { status: 400 }
    );
  }

  const validCodes = (process.env.INVITATION_CODES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const isValid = validCodes.includes(code.trim().toUpperCase());

  return NextResponse.json({ valid: isValid });
}
