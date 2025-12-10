import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id") || "anonymous";

    // Check if FastAPI backend is configured
    const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";
    const USE_FASTAPI_BACKEND = process.env.USE_FASTAPI_BACKEND === "true";

    if (!USE_FASTAPI_BACKEND) {
      // No backend configured, return empty history
      return NextResponse.json({
        session_id: sessionId,
        messages: [],
      });
    }

    // Fetch history from backend
    const response = await fetch(
      `${FASTAPI_BACKEND_URL}/history/${sessionId}?user_id=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Backend history error: ${response.status}`);
      // Return empty history on error instead of failing
      return NextResponse.json({
        session_id: sessionId,
        messages: [],
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("History API error:", error);
    // Return empty history on error
    return NextResponse.json({
      session_id: params.sessionId,
      messages: [],
    });
  }
}
