import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GOOGLE_API_KEY in .env.local" },
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
