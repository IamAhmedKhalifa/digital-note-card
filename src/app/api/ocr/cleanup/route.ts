import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PROMPT = `You are cleaning up text extracted by OCR from a handwritten reading notecard.

The raw OCR text may contain:
1. Character-level misreads (e.g. "Lisciplined" instead of "Disciplined", "l" read as capital "L")
2. Words split by an errant space (e.g. "Dise plined" → "Disciplined")
3. Words run together without a space
4. Letters transposed (e.g. "Hedgelog" → "Hedgehog", "knowan" → "known", "menage" → "manage")
5. Words from adjacent handwritten lines interleaved due to multi-column scanning (reorder them into natural reading order)
6. Wrong capitalisation at the start of mid-sentence words

Your task:
- Fix all of the above OCR errors so the text reads naturally
- Preserve paragraph breaks (blank lines between sections)
- Keep all proper nouns, book titles, author names, and specialist terminology intact
- Do NOT add, remove, or paraphrase any content — only correct OCR errors
- Return only the corrected text, with no preamble, explanation, or markdown formatting`;

export async function POST(request: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text field" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: key });

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${PROMPT}\n\nRaw OCR text:\n${text}`,
        },
      ],
    });

    const cleaned =
      message.content[0].type === "text" ? message.content[0].text.trim() : text;

    return NextResponse.json({ text: cleaned });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
