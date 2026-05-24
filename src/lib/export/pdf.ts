import type { Book, Card } from "@/types/database";
import type {
  CardType,
  ChapterTrackerContent,
  QuoteTrackerContent,
  CharacterTrackerContent,
  VocabularyTrackerContent,
} from "@/types/cards";
import { CARD_TYPE_LABELS, CARD_TYPE_ORDER } from "@/types/cards";

export async function exportBookAsPdf(book: Book, cards: Card[]): Promise<void> {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const MARGIN = 14;
  const CONTENT_WIDTH = W - MARGIN * 2;

  // ── Brand colours (RGB) ──────────────────────────────────────────────────
  const GREEN = [47, 70, 56] as [number, number, number];
  const WARM = [255, 255, 240] as [number, number, number];
  const CHARCOAL = [28, 28, 28] as [number, number, number];
  const GOLD = [209, 178, 23] as [number, number, number];
  const GREY = [207, 207, 207] as [number, number, number];
  const SURFACE = [245, 243, 237] as [number, number, number];

  // ── Group cards by type ──────────────────────────────────────────────────
  const grouped = new Map<CardType, Card[]>();
  for (const type of CARD_TYPE_ORDER) {
    const matching = cards.filter((c) => c.card_type === type);
    if (matching.length > 0) grouped.set(type, matching);
  }

  // ── Page helpers ─────────────────────────────────────────────────────────
  let y = 0;
  let pageNum = 1;

  function checkPage(needed = 20): void {
    if (y + needed > 272) {
      doc.addPage();
      pageNum++;
      y = MARGIN;
      drawPageHeader();
    }
  }

  function drawPageHeader(): void {
    // Thin green bar at top
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, W, 10, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...WARM);
    doc.text("Digital Note Card", MARGIN, 6.5);
    doc.text(book.title, W - MARGIN, 6.5, { align: "right" });
  }

  // ── Cover page ────────────────────────────────────────────────────────────
  // Header bar
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 50, "F");

  doc.setTextColor(...WARM);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Digital Note Card", MARGIN, 22);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Read with direction", MARGIN, 30);

  // Gold accent line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, 36, W - MARGIN, 36);

  // Book info
  doc.setTextColor(...CHARCOAL);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(book.title, MARGIN, 60);

  if (book.author) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(book.author, MARGIN, 68);
  }

  // Stats
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CHARCOAL);
  doc.text(`${cards.length} card${cards.length !== 1 ? "s" : ""} captured`, MARGIN, 80);
  doc.text(
    `Exported ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    MARGIN,
    86
  );

  // ── Card sections ─────────────────────────────────────────────────────────
  for (const [type, typeCards] of grouped) {
    doc.addPage();
    pageNum++;
    y = MARGIN;

    drawPageHeader();
    y = 18;

    // Section header
    doc.setFillColor(...SURFACE);
    doc.rect(MARGIN - 2, y - 4, CONTENT_WIDTH + 4, 12, "F");
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN - 2, y - 4, CONTENT_WIDTH + 4, 12, "S");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text(CARD_TYPE_LABELS[type], MARGIN, y + 3.5);
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text(
      `${typeCards.length} card${typeCards.length !== 1 ? "s" : ""}`,
      W - MARGIN,
      y + 3.5,
      { align: "right" }
    );
    y += 14;

    for (const card of typeCards) {
      checkPage(30);

      // Card background
      const startY = y;
      const content = card.content as unknown;

      // Render fields
      const fields = getFieldsForPdf(card.card_type, content);
      const lineH = 5.5;
      let cardHeight = 8;
      for (const [, val] of fields) {
        const lines = doc.splitTextToSize(String(val || "—"), CONTENT_WIDTH - 8);
        cardHeight += lines.length * lineH + 3;
      }
      cardHeight = Math.max(cardHeight, 20);

      // Card box
      doc.setFillColor(...SURFACE);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 2, 2, "F");
      doc.setDrawColor(...GREY);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 2, 2, "S");

      // Card type badge
      doc.setFillColor(...GREEN);
      doc.setTextColor(...WARM);
      doc.setFontSize(7);
      doc.roundedRect(MARGIN + 3, y + 3, 26, 4.5, 1, 1, "F");
      doc.text(CARD_TYPE_LABELS[type], MARGIN + 16, y + 6.3, { align: "center" });

      y += 10;

      for (const [label, val] of fields) {
        checkPage(10);
        const text = String(val || "—");
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 8);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GREEN);
        doc.text(label.toUpperCase(), MARGIN + 4, y);
        y += 4;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...CHARCOAL);
        doc.text(lines, MARGIN + 4, y);
        y += lines.length * lineH + 3;
      }

      const cardEnd = startY + cardHeight;
      if (y < cardEnd) y = cardEnd;
      y += 5;
    }
  }

  // ── Page footers ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages: number = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 282, W - MARGIN, 282);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Read with direction — northchapter.co", MARGIN, 286);
    doc.text(`${i - 1} / ${totalPages - 1}`, W - MARGIN, 286, { align: "right" });
  }

  const filename = `${book.title.replace(/[^a-z0-9]/gi, "_")} - Notes.pdf`;
  doc.save(filename);
}

function getFieldsForPdf(
  type: CardType,
  content: unknown
): Array<[string, string]> {
  switch (type) {
    case "chapter_tracker": {
      const c = content as ChapterTrackerContent;
      return [
        ["Chapter", c.chapter],
        ["Pages", c.pages],
        ["Main Points", c.main_points],
        ["Learnings to Apply", c.learnings_to_apply],
      ];
    }
    case "quote_tracker": {
      const c = content as QuoteTrackerContent;
      return [
        ["Quote", c.quote],
        ["Author", c.book_author],
        ["Reflection", c.reflection],
        ["Date", c.date],
      ];
    }
    case "character_tracker": {
      const c = content as CharacterTrackerContent;
      const chars = (c.characters || [])
        .map((ch) => `${ch.name}: ${ch.role_traits}`)
        .join("\n");
      return [
        ["Characters", chars],
        ["Notes", c.character_notes],
      ];
    }
    case "vocabulary_tracker": {
      const c = content as VocabularyTrackerContent;
      const words = (c.words || [])
        .map((w) => `${w.word}: ${w.definition}`)
        .join("\n");
      return [["Words", words]];
    }
    case "reading_notes":
    case "general":
      return [["Notes", (content as unknown as { notes: string }).notes]];
  }
}
