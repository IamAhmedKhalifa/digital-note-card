"use client";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { Card } from "@/types/database";
import {
  CARD_TYPE_LABELS,
  CARD_TYPE_ORDER,
  type CardType,
  type ChapterTrackerContent,
  type QuoteTrackerContent,
  type CharacterTrackerContent,
  type VocabularyTrackerContent,
} from "@/types/cards";

interface CardListProps {
  cards: Card[];
  bookId: string;
}

export default function CardList({ cards }: CardListProps) {
  if (cards.length === 0) return null;

  // Group cards by type, preserving CARD_TYPE_ORDER for section ordering
  const grouped = new Map<CardType, Card[]>();
  for (const type of CARD_TYPE_ORDER) {
    const matching = cards.filter((c) => c.card_type === type);
    if (matching.length > 0) grouped.set(type, matching);
  }

  return (
    <>
      <div className="flex flex-col gap-6 px-4">
        {[...grouped.entries()].map(([type, typeCards]) => (
          <section key={type} aria-labelledby={`section-${type}`}>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <h2
                id={`section-${type}`}
                className="text-xs font-semibold uppercase tracking-wider text-nc-green"
              >
                {CARD_TYPE_LABELS[type]}
              </h2>
              <span className="text-xs text-nc-charcoal/40">
                {typeCards.length}
              </span>
            </div>

            <div className="bg-nc-surface rounded-2xl overflow-hidden border border-nc-grey">
              {typeCards.map((card, i) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className={`
                    flex items-center gap-3 px-4 py-3
                    hover:bg-nc-grey/30 active:bg-nc-grey/50 transition-colors
                    ${i < typeCards.length - 1 ? "border-b border-nc-grey" : ""}
                  `}
                  style={{ animation: `fadeUp 0.25s ease-out ${i * 0.04}s both` }}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-nc-grey/40 shrink-0 flex items-center justify-center">
                    {card.front_image_url ? (
                      <Image
                        src={card.front_image_url}
                        alt="Note thumbnail"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xl">{iconForType(type)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-nc-charcoal truncate leading-snug">
                      {getCardPreview(card)}
                    </p>
                    {!card.is_edited && (
                      <span className="text-xs text-nc-gold bg-nc-gold/10 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                        Unreviewed
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-nc-charcoal/30 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function iconForType(type: CardType): string {
  switch (type) {
    case "chapter_tracker": return "📖";
    case "quote_tracker": return "💬";
    case "character_tracker": return "👤";
    case "vocabulary_tracker": return "🔤";
    case "reading_notes": return "📝";
    case "general": return "📝";
  }
}

/** Pick the most representative field for each card type as the preview */
function getCardPreview(card: Card): string {
  const c = card.content as unknown;

  switch (card.card_type) {
    case "chapter_tracker": {
      const x = c as ChapterTrackerContent;
      const head = [x.chapter, x.pages].filter(Boolean).join(" · ");
      const body = x.main_points || x.learnings_to_apply;
      const text = [head, body].filter(Boolean).join(" — ");
      if (text) return stripHtml(text).slice(0, 90);
      break;
    }
    case "quote_tracker": {
      const x = c as QuoteTrackerContent;
      const text = x.quote || x.reflection;
      if (text) return `"${stripHtml(text).slice(0, 80)}"`;
      break;
    }
    case "character_tracker": {
      const x = c as CharacterTrackerContent;
      const names = (x.characters ?? [])
        .map((ch) => ch.name)
        .filter(Boolean)
        .join(", ");
      if (names) return names.slice(0, 90);
      if (x.character_notes) return stripHtml(x.character_notes).slice(0, 90);
      break;
    }
    case "vocabulary_tracker": {
      const x = c as VocabularyTrackerContent;
      const words = (x.words ?? [])
        .map((w) => w.word)
        .filter(Boolean)
        .join(", ");
      if (words) return words.slice(0, 90);
      break;
    }
    case "reading_notes":
    case "general": {
      const x = c as { notes?: string };
      if (x.notes) return stripHtml(x.notes).slice(0, 90);
      break;
    }
  }

  if (card.raw_ocr_text) return card.raw_ocr_text.slice(0, 90);
  return "—";
}
