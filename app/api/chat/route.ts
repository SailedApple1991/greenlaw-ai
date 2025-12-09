import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history, session_id, user_id } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Check if FastAPI backend is configured
    const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";
    const USE_FASTAPI_BACKEND = process.env.USE_FASTAPI_BACKEND === "true";

    // Option 1: Use FastAPI backend (connects to RAGFlow)
    if (USE_FASTAPI_BACKEND) {
      try {
        const backendResponse = await fetch(`${FASTAPI_BACKEND_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            stream: false,
            reference: true,
            conversation_history: conversation_history || [],
            session_id: session_id,
            user_id: user_id,
          }),
        });

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || `Backend error: ${backendResponse.statusText}`);
        }

        const backendData = await backendResponse.json();
        return NextResponse.json(backendData);
      } catch (error) {
        console.error("FastAPI backend error:", error);
        // Fallback to Gemini if backend fails
        console.log("Falling back to Gemini API...");
      }
    }

    // Option 2: Use Gemini API directly (fallback or default)
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "No backend configured. Please set either USE_FASTAPI_BACKEND=true with FastAPI running, or set GOOGLE_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Call Gemini API
    // TODO: Add RAG context retrieval with retrieveTopK(message, 5) later
    const content = await askGemini(message);

    const response = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      references: [
        // TODO: Parse references from Gemini response or RAG context
      ],
      citation: "",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}

// Example integration with OpenAI (commented out):
/*
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are GreenLaw AI, an expert environmental law and policy assistant. Provide accurate information with proper legal citations."
      },
      {
        role: "user",
        content: message
      }
    ],
  });

  return NextResponse.json({
    content: completion.choices[0].message.content,
    // Parse references from response...
  });
}
*/
