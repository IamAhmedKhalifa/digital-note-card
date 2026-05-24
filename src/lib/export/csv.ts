import type { Book, Card } from "@/types/database";
import type { VocabularyTrackerContent } from "@/types/cards";

export function exportVocabularyAsCsv(book: Book, cards: Card[]): void {
  const vocabCards = cards.filter((c) => c.card_type === "vocabulary_tracker");

  if (vocabCards.length === 0) {
    alert("No Vocabulary Tracker cards found for this book.");
    return;
  }

  const rows: string[] = ["word,definition"];

  for (const card of vocabCards) {
    const content = card.content as VocabularyTrackerContent;
    for (const w of content.words || []) {
      if (w.word) {
        rows.push(`${csvEscape(w.word)},${csvEscape(w.definition)}`);
      }
    }
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${book.title.replace(/[^a-z0-9]/gi, "_")}_vocabulary.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
