import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthClient } from "@/lib/supabase/api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const auth = await getAuthClient();
    if (auth.error) return auth.error;
    const { client: supabase, userId } = auth;

    // Fetch the book
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("title, author")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (bookErr || !book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    // Fetch all cards for the book
    const { data: cards, error: cardsErr } = await supabase
      .from("cards")
      .select("content, raw_ocr_text, tags")
      .eq("book_id", id)
      .order("created_at", { ascending: true });

    if (cardsErr) throw cardsErr;

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        { error: "No cards found for this book." },
        { status: 400 }
      );
    }

    // Build context from cards
    const cardTexts = cards
      .map((c, i) => {
        const notes =
          (c.content as { notes?: string })?.notes ||
          c.raw_ocr_text ||
          "";
        const tags =
          Array.isArray(c.tags) && c.tags.length > 0
            ? ` [tags: ${c.tags.join(", ")}]`
            : "";
        return `Note ${i + 1}${tags}:\n${notes}`;
      })
      .join("\n\n---\n\n");

    const authorLine = book.author ? ` by ${book.author}` : "";
    const prompt = `You are a thoughtful reading companion. Below are handwritten reading notes taken from the book "${book.title}"${authorLine}.

Please provide a concise, insightful summary (3–5 paragraphs) that:
1. Captures the key ideas and themes from the notes
2. Highlights the most memorable quotes or insights
3. Identifies recurring topics or tags
4. Ends with 3 practical takeaways the reader noted

Here are the reading notes:

${cardTexts}

Write the summary in a warm, reflective tone — as if you're helping the reader revisit what they learned.`;

    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[POST /api/books/[id]/summary]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
