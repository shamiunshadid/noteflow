import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const action = (formData.get("action") as string) || "transcribe";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Check file type
    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/x-m4a",
      "audio/mp3",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(mp3|wav|m4a|mp4)$/i)
    ) {
      return NextResponse.json(
        { error: "Invalid audio format. Supported formats: mp3, wav, m4a" },
        { status: 400 },
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Transcribe audio using ASR
    const asrResult = await zai.audio.asr.create({
      file_base64: base64Audio,
    });

    const transcription = asrResult.text;

    // If action is "meeting-minutes", generate structured minutes
    if (action === "meeting-minutes" && transcription) {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: `You are a meeting assistant. Your task is to analyze meeting transcriptions and generate structured meeting minutes.

Return your response in the following Markdown format:

# Meeting Topic
[Brief description of the main topic]

## Key Discussion Points
- [Point 1]
- [Point 2]
- [Point 3]

## Action Items
- [ ] [Task 1] - @[Assignee if mentioned]
- [ ] [Task 2] - @[Assignee if mentioned]

## Decisions Made
- [Decision 1]
- [Decision 2]

## Summary
[Brief summary of the meeting]`,
          },
          {
            role: "user",
            content: `Generate meeting minutes from this transcription:\n\n${transcription}`,
          },
        ],
        thinking: { type: "disabled" },
      });

      const meetingMinutes =
        completion.choices[0]?.message?.content || transcription;

      return NextResponse.json({
        text: transcription,
        content: meetingMinutes,
      });
    }

    return NextResponse.json({
      text: transcription,
      content: transcription,
    });
  } catch (error) {
    console.error("Transcribe API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
