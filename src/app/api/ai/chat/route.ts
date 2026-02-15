import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey, noteId, conversationHistory } =
      await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      {
        role: "assistant",
        content:
          "You are a helpful AI assistant for NoteFlow, a personal knowledge base application. Help users with their notes, answer questions, and provide assistance with content creation and editing. Be concise and helpful.",
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Create chat completion
    const completion = await zai.chat.completions.create({
      messages: messages as Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }>,
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process chat",
      },
      { status: 500 },
    );
  }
}
