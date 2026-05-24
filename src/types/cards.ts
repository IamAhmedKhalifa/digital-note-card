export type CardType =
  | "chapter_tracker"
  | "quote_tracker"
  | "character_tracker"
  | "vocabulary_tracker"
  | "reading_notes"
  | "general";

export interface ChapterTrackerContent {
  chapter: string;
  pages: string;
  main_points: string;
  learnings_to_apply: string;
}

export interface QuoteTrackerContent {
  quote: string;
  book_author: string;
  reflection: string;
  date: string;
}

export interface CharacterTrackerContent {
  characters: Array<{ name: string; role_traits: string }>;
  character_notes: string;
}

export interface VocabularyTrackerContent {
  words: Array<{ word: string; definition: string }>;
}

export interface ReadingNotesContent {
  notes: string;
}

export interface GeneralContent {
  notes: string;
}

export type CardContent =
  | ChapterTrackerContent
  | QuoteTrackerContent
  | CharacterTrackerContent
  | VocabularyTrackerContent
  | ReadingNotesContent
  | GeneralContent;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  chapter_tracker: "Chapter Tracker",
  quote_tracker: "Quote Tracker",
  character_tracker: "Character Tracker",
  vocabulary_tracker: "Vocabulary Tracker",
  reading_notes: "Reading Notes",
  general: "General Notes",
};

export const CARD_TYPE_ORDER: CardType[] = [
  "chapter_tracker",
  "quote_tracker",
  "character_tracker",
  "vocabulary_tracker",
  "reading_notes",
  "general",
];

export function getDefaultContent(type: CardType): CardContent {
  switch (type) {
    case "chapter_tracker":
      return { chapter: "", pages: "", main_points: "", learnings_to_apply: "" };
    case "quote_tracker":
      return { quote: "", book_author: "", reflection: "", date: "" };
    case "character_tracker":
      return { characters: [{ name: "", role_traits: "" }], character_notes: "" };
    case "vocabulary_tracker":
      return { words: [{ word: "", definition: "" }] };
    case "reading_notes":
      return { notes: "" };
    case "general":
      return { notes: "" };
  }
}

/** Heuristic: look for known header text to auto-detect card type */
export function detectCardType(rawText: string): CardType | null {
  const upper = rawText.toUpperCase();
  if (upper.includes("CHAPTER TRACKER")) return "chapter_tracker";
  if (upper.includes("QUOTE TRACKER")) return "quote_tracker";
  if (upper.includes("CHARACTER TRACKER")) return "character_tracker";
  if (upper.includes("VOCABULARY TRACKER") || upper.includes("VOCAB TRACKER"))
    return "vocabulary_tracker";
  if (upper.includes("READING NOTES")) return "reading_notes";
  return null;
}

/** Best-effort mapping of raw OCR text into the structured fields for a given type */
export function parseOcrIntoContent(rawText: string, type: CardType): CardContent {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const after = (keyword: string): string => {
    const idx = lines.findIndex((l) =>
      l.toLowerCase().includes(keyword.toLowerCase())
    );
    if (idx === -1) return "";
    const same = extractAfterColon(lines[idx]);
    if (same) return same;
    return lines
      .slice(idx + 1)
      .slice(0, 4)
      .join("\n");
  };

  switch (type) {
    case "chapter_tracker": {
      const content: ChapterTrackerContent = {
        chapter: after("chapter") || "",
        pages: after("pages") || after("page") || "",
        main_points: after("main point") || after("key point") || after("points") || "",
        learnings_to_apply: after("learning") || after("apply") || "",
      };
      if (!content.chapter && !content.main_points) {
        content.main_points = rawText;
      }
      return content;
    }
    case "quote_tracker": {
      return {
        quote: after("quote") || rawText.slice(0, 200),
        book_author: after("author") || after("book") || "",
        reflection: after("reflection") || after("thought") || "",
        date: after("date") || "",
      };
    }
    case "character_tracker": {
      return {
        characters: [{ name: after("character") || after("name") || "", role_traits: after("role") || after("trait") || "" }],
        character_notes: after("notes") || after("note") || "",
      };
    }
    case "vocabulary_tracker": {
      const words: Array<{ word: string; definition: string }> = [];
      for (let i = 0; i < lines.length; i++) {
        const colonIdx = lines[i].indexOf(":");
        if (colonIdx > 0 && colonIdx < 40) {
          words.push({
            word: lines[i].slice(0, colonIdx).trim(),
            definition: lines[i].slice(colonIdx + 1).trim(),
          });
        }
      }
      return { words: words.length > 0 ? words : [{ word: "", definition: rawText }] };
    }
    case "reading_notes":
    case "general":
      return { notes: rawText };
  }
}

function extractAfterColon(line: string): string {
  const idx = line.indexOf(":");
  if (idx >= 0 && idx < line.length - 1) {
    return line.slice(idx + 1).trim();
  }
  return "";
}
