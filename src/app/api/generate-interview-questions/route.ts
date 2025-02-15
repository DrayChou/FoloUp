import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  generateQuestionsPrompt,
} from "@/lib/prompts/generate-questions";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: Request, res: Response) {
  logger.info("generate-interview-questions request received");
  const body = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
    maxRetries: 5,
    dangerouslyAllowBrowser: true,
  });

  try {
    const baseCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: generateQuestionsPrompt(body),
        },
      ],
      response_format: { type: "json_object" },
    });

    const basePromptOutput = baseCompletion.choices[0] || {};
    let content = basePromptOutput.message?.content;

    // 检查是不是 json 结构，如果是 ```json 这样的结构，需要解析
    if (content.startsWith("```json") && content.endsWith("```")) {
      content = content.slice(7, content.length - 3);
    } else if (content.startsWith("```") && content.endsWith("```")) {
      content = content.slice(3, content.length - 3);
    }

    logger.info("Interview questions generated successfully", content);

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating interview questions");

    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
