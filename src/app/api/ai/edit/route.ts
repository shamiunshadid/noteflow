import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const ACTION_PROMPTS: Record<string, string> = {
  polish:
    "Improve the writing quality, fix any issues, and make it more readable while maintaining the original meaning:",
  expand:
    "Expand this content with more details, examples, and explanations while keeping the same tone and style:",
  condense:
    "Condense this content while preserving all key information and the main message:",
  formalize:
    "Rewrite this content in a more formal, professional tone suitable for business contexts:",
  casual:
    "Rewrite this content in a more casual, friendly, conversational tone:",
  translate: "Translate this content to",
  "fix-grammar":
    "Fix all grammar, spelling, and punctuation errors in this text while maintaining the original meaning:",
};

export async function POST(request: NextRequest) {
  try {
    const { text, action, language, apiKey } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Build the prompt based on action
    let prompt = "";
    if (action === "translate") {
      prompt = `${ACTION_PROMPTS[action]} ${language || "English"}:\n\n${text}`;
    } else {
      prompt = `${ACTION_PROMPTS[action] || ACTION_PROMPTS.polish}\n\n${text}`;
    }

    // Create chat completion
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are a professional editor. Your task is to edit text according to the user's instructions. Return only the edited text without explanations or commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      thinking: { type: "disabled" },
    });

    const editedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ editedText });
  } catch (error) {
    console.error("Edit API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit text" },
      { status: 500 },
    );
  }
}
