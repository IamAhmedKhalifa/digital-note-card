"use client";
import { useState } from "react";
import Image from "next/image";
import type { Card } from "@/types/database";
import type { GeneralContent } from "@/types/cards";

interface FlashcardViewProps {
  card: Card;
}

export default function FlashcardView({ card }: FlashcardViewProps) {
  const [flipped, setFlipped] = useState(false);

  const notes = (card.content as GeneralContent)?.notes ?? card.raw_ocr_text ?? "";
  const hasBothImages = !!(card.front_image_url && card.back_image_url);

  // Split notes at double newline for front/back if user saved as one note
  const [frontNotes, backNotes] = (() => {
    const parts = notes.split(/\n\n+/);
    if (parts.length === 1) return [notes, ""];
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join("\n\n"), parts.slice(mid).join("\n\n")];
  })();

  return (
    <>
      <style>{`
        .card-html-content p { margin-bottom: 0.4em; }
        .card-html-content p:last-child { margin-bottom: 0; }
        .card-html-content h2 { font-size: 1.125rem; font-weight: 600; margin: 0.5em 0 0.3em; }
        .card-html-content h2:first-child { margin-top: 0; }
        .card-html-content ul { list-style: disc; padding-left: 1.5em; margin-bottom: 0.4em; }
        .card-html-content ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 0.4em; }
        .card-html-content li { margin-bottom: 0.1em; }
        .card-html-content strong { font-weight: 600; }
        .card-html-content em { font-style: italic; }
      `}</style>
      {/* Flip card */}
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "260px",
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-2xl bg-nc-surface border border-nc-grey flex flex-col overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <FaceContent
              label="Front"
              imageUrl={card.front_image_url}
              notes={hasBothImages ? frontNotes : notes}
              tags={card.tags}
            />
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 rounded-2xl bg-nc-warm border border-nc-grey flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <FaceContent
              label="Back"
              imageUrl={hasBothImages ? card.back_image_url : null}
              notes={hasBothImages ? backNotes : ""}
              tags={[]}
            />
          </div>
        </div>
      </div>

      {/* Tap hint */}
      <p className="text-center text-xs text-nc-charcoal/40 mt-3">
        {flipped ? "Tap to see front" : "Tap to flip"}
      </p>
    </>
  );
}

function FaceContent({
  label,
  imageUrl,
  notes,
  tags,
}: {
  label: string;
  imageUrl: string | null | undefined;
  notes: string;
  tags: string[];
}) {
  return (
    <div className="flex flex-col h-full p-5 gap-4" style={{ minHeight: "260px" }}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-nc-charcoal/30">
        {label}
      </span>

      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-nc-grey">
          <Image
            src={imageUrl}
            alt={`${label} image`}
            width={600}
            height={400}
            className="w-full h-auto object-cover"
            unoptimized
          />
        </div>
      )}

      {notes ? (
        <div
          className="flex-1 text-sm text-nc-charcoal leading-relaxed overflow-auto card-html-content"
          dangerouslySetInnerHTML={{ __html: notes }}
        />
      ) : (
        <p className="flex-1 flex items-center justify-center text-sm text-nc-charcoal/30 italic">
          {imageUrl ? "See image above" : "No content"}
        </p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-nc-green/10 text-nc-green font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
