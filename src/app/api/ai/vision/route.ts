import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const action = (formData.get("action") as string) || "ocr";
    const customPrompt = formData.get("prompt") as string;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString("base64");

    // Determine file type
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const mimeType = isPDF ? "application/pdf" : file.type;

    // Build the data URL
    const dataUrl = `data:${mimeType};base64,${base64File}`;

    // Build prompt based on action
    let prompt = customPrompt;
    if (!prompt) {
      switch (action) {
        case "ocr":
          prompt =
            "Extract all text from this image. Preserve the layout and formatting as much as possible. Only return the extracted text.";
          break;
        case "chart":
          prompt =
            "Analyze this chart or graph. Describe what it shows, identify the data, trends, and key insights. Format your response in Markdown.";
          break;
        case "table":
          prompt =
            "Extract any tables from this image. Present the data in a formatted Markdown table. Also describe what the table represents.";
          break;
        case "formula":
          prompt =
            "Extract any mathematical formulas from this image. Present them in LaTeX format and explain what each formula represents.";
          break;
        case "describe":
          prompt =
            "Describe this image in detail. Include all visual elements, text, layout, and any relevant context.";
          break;
        default:
          prompt =
            "Analyze this image and extract all relevant information including text, charts, tables, and other content. Present the results in a structured Markdown format.";
      }
    }

    // Create vision completion
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            isPDF
              ? {
                  type: "file_url",
                  file_url: { url: dataUrl },
                }
              : {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const result = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      content: result,
      text: result,
    });
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process image",
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
