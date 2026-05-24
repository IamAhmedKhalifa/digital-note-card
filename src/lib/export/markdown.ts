import type { Book, Card } from "@/types/database";
import type {
  CardType,
  ChapterTrackerContent,
  QuoteTrackerContent,
  CharacterTrackerContent,
  VocabularyTrackerContent,
} from "@/types/cards";
import { CARD_TYPE_LABELS, CARD_TYPE_ORDER } from "@/types/cards";

export function exportBookAsMarkdown(book: Book, cards: Card[]): void {
  const lines: string[] = [];

  lines.push(`# ${book.title}`);
  if (book.author) lines.push(`*by ${book.author}*`);
  lines.push("");
  lines.push(
    `> Exported ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} — Digital Note Card by [North Chapter](https://northchapter.co)`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  const grouped = new Map<CardType, Card[]>();
  for (const type of CARD_TYPE_ORDER) {
    const matching = cards.filter((c) => c.card_type === type);
    if (matching.length > 0) grouped.set(type, matching);
  }

  for (const [type, typeCards] of grouped) {
    lines.push(`## ${CARD_TYPE_LABELS[type]}`);
    lines.push("");

    for (const card of typeCards) {
      const content = card.content as unknown;
      lines.push(...renderCardMarkdown(type, content));
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  triggerDownload(blob, `${book.title.replace(/[^a-z0-9]/gi, "_")}_notes.md`);
}

function renderCardMarkdown(
  type: CardType,
  content: unknown
): string[] {
  const lines: string[] = [];

  switch (type) {
    case "chapter_tracker": {
      const c = content as ChapterTrackerContent;
      if (c.chapter) lines.push(`**Chapter:** ${c.chapter}`);
      if (c.pages) lines.push(`**Pages:** ${c.pages}`);
      if (c.main_points) {
        lines.push("", "**Main Points:**", "");
        lines.push(c.main_points);
      }
      if (c.learnings_to_apply) {
        lines.push("", "**Learnings to Apply:**", "");
        lines.push(c.learnings_to_apply);
      }
      break;
    }
    case "quote_tracker": {
      const c = content as QuoteTrackerContent;
      if (c.quote) lines.push(`> ${c.quote}`);
      if (c.book_author) lines.push(`*— ${c.book_author}*`);
      if (c.date) lines.push(`*${c.date}*`);
      if (c.reflection) {
        lines.push("", "**Reflection:**", "");
        lines.push(c.reflection);
      }
      break;
    }
    case "character_tracker": {
      const c = content as CharacterTrackerContent;
      for (const ch of c.characters || []) {
        if (ch.name) lines.push(`### ${ch.name}`);
        if (ch.role_traits) lines.push(ch.role_traits);
        lines.push("");
      }
      if (c.character_notes) {
        lines.push("**Notes:**", "");
        lines.push(c.character_notes);
      }
      break;
    }
    case "vocabulary_tracker": {
      const c = content as VocabularyTrackerContent;
      for (const w of c.words || []) {
        if (w.word) lines.push(`**${w.word}** — ${w.definition}`);
      }
      break;
    }
    case "reading_notes":
    case "general": {
      const c = content as { notes: string };
      if (c.notes) lines.push(c.notes);
      break;
    }
  }

  return lines;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
