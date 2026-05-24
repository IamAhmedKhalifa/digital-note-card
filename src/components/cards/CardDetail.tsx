"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Save } from "lucide-react";
import ImageZoom from "@/components/ui/ImageZoom";
import Button from "@/components/ui/Button";
import GeneralNotesEditor from "@/components/cards/editors/GeneralNotesEditor";
import ChapterTrackerEditor from "@/components/cards/editors/ChapterTrackerEditor";
import QuoteTrackerEditor from "@/components/cards/editors/QuoteTrackerEditor";
import CharacterTrackerEditor from "@/components/cards/editors/CharacterTrackerEditor";
import VocabularyTrackerEditor from "@/components/cards/editors/VocabularyTrackerEditor";
import ReadingNotesEditor from "@/components/cards/editors/ReadingNotesEditor";
import type { Card } from "@/types/database";
import {
  CARD_TYPE_LABELS,
  type CardContent,
  type ChapterTrackerContent,
  type QuoteTrackerContent,
  type CharacterTrackerContent,
  type VocabularyTrackerContent,
  type ReadingNotesContent,
  type GeneralContent,
} from "@/types/cards";

interface CardDetailProps {
  card: Card;
}

export default function CardDetail({ card: initialCard }: CardDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState<CardContent>(
    initialCard.content as CardContent
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${initialCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      setEditing(false);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    setDeleting(true);

    const res = await fetch(`/api/cards/${initialCard.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete card.");
      setDeleting(false);
      return;
    }

    router.push(`/books/${initialCard.book_id}`);
    router.refresh();
  }

  return (
    <>
      <style>{`
        .card-html-content p { margin-bottom: 0.4em; }
        .card-html-content p:last-child { margin-bottom: 0; }
        .card-html-content h2 { font-size: 1.125rem; font-weight: 600; margin: 0.75em 0 0.4em; }
        .card-html-content h2:first-child { margin-top: 0; }
        .card-html-content ul { list-style: disc; padding-left: 1.5em; margin-bottom: 0.4em; }
        .card-html-content ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 0.4em; }
        .card-html-content li { margin-bottom: 0.15em; }
        .card-html-content strong { font-weight: 600; }
        .card-html-content em { font-style: italic; }
        .card-html-content blockquote { border-left: 3px solid #2f4638; padding-left: 1em; opacity: 0.7; margin-bottom: 0.4em; }
      `}</style>
      <div className="flex flex-col gap-5">
        {/* Images */}
        {initialCard.front_image_url && (
          <div className="flex flex-col gap-3">
            <ImageZoom src={initialCard.front_image_url} alt="Notes front" />
            {initialCard.back_image_url && (
              <ImageZoom src={initialCard.back_image_url} alt="Notes back" />
            )}
          </div>
        )}

        {/* Type badge + unreviewed badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-nc-green/10 text-nc-green">
            {CARD_TYPE_LABELS[initialCard.card_type]}
          </span>
          {!initialCard.is_edited && (
            <span className="text-xs text-nc-gold bg-nc-gold/10 px-2 py-0.5 rounded-full">
              Unreviewed
            </span>
          )}
        </div>

        {/* Content — view or edit */}
        {editing ? (
          <>
            <EditView
              type={initialCard.card_type}
              content={content}
              onChange={setContent}
            />
            <div className="flex gap-3">
              <Button fullWidth loading={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="ghost"
                fullWidth
                disabled={saving}
                onClick={() => {
                  setContent(initialCard.content as CardContent);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <ReadView card={initialCard} content={content} />

            <div className="flex gap-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="danger"
                loading={deleting}
                onClick={handleDelete}
                className="px-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Edit view ─────────────────────────────────────────────────────────────
function EditView({
  type,
  content,
  onChange,
}: {
  type: Card["card_type"];
  content: CardContent;
  onChange: (c: CardContent) => void;
}) {
  switch (type) {
    case "chapter_tracker":
      return (
        <ChapterTrackerEditor
          content={content as ChapterTrackerContent}
          onChange={onChange}
        />
      );
    case "quote_tracker":
      return (
        <QuoteTrackerEditor
          content={content as QuoteTrackerContent}
          onChange={onChange}
        />
      );
    case "character_tracker":
      return (
        <CharacterTrackerEditor
          content={content as CharacterTrackerContent}
          onChange={onChange}
        />
      );
    case "vocabulary_tracker":
      return (
        <VocabularyTrackerEditor
          content={content as VocabularyTrackerContent}
          onChange={onChange}
        />
      );
    case "reading_notes":
      return (
        <ReadingNotesEditor
          content={content as ReadingNotesContent}
          onChange={onChange}
        />
      );
    case "general":
      return (
        <GeneralNotesEditor
          content={content as GeneralContent}
          onChange={onChange}
        />
      );
  }
}

// ─── Read view — structured rendering per type ─────────────────────────────
function ReadView({ card, content }: { card: Card; content: CardContent }) {
  switch (card.card_type) {
    case "chapter_tracker": {
      const c = content as ChapterTrackerContent;
      return (
        <div className="flex flex-col gap-4">
          {(c.chapter || c.pages) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {c.chapter && <Field label="Chapter" value={c.chapter} />}
              {c.pages && <Field label="Pages" value={c.pages} />}
            </div>
          )}
          {c.main_points && <Block label="Main points" value={c.main_points} />}
          {c.learnings_to_apply && (
            <Block label="Learnings to apply" value={c.learnings_to_apply} />
          )}
        </div>
      );
    }
    case "quote_tracker": {
      const c = content as QuoteTrackerContent;
      return (
        <div className="flex flex-col gap-4">
          {c.quote && (
            <blockquote className="border-l-4 border-nc-green pl-4 py-1 text-base text-nc-charcoal italic">
              “{c.quote}”
            </blockquote>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {c.book_author && <Field label="Author / source" value={c.book_author} />}
            {c.date && <Field label="Date noted" value={c.date} />}
          </div>
          {c.reflection && <Block label="Reflection" value={c.reflection} />}
        </div>
      );
    }
    case "character_tracker": {
      const c = content as CharacterTrackerContent;
      return (
        <div className="flex flex-col gap-4">
          {(c.characters ?? []).filter((ch) => ch.name || ch.role_traits).length >
            0 && (
            <div className="flex flex-col gap-3">
              {(c.characters ?? [])
                .filter((ch) => ch.name || ch.role_traits)
                .map((ch, i) => (
                  <div
                    key={i}
                    className="bg-nc-surface rounded-xl border border-nc-grey p-3"
                  >
                    {ch.name && (
                      <p className="text-sm font-semibold text-nc-charcoal">
                        {ch.name}
                      </p>
                    )}
                    {ch.role_traits && (
                      <p className="text-sm text-nc-charcoal/70 mt-1 whitespace-pre-wrap">
                        {ch.role_traits}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
          {c.character_notes && (
            <Block label="Character notes" value={c.character_notes} />
          )}
        </div>
      );
    }
    case "vocabulary_tracker": {
      const c = content as VocabularyTrackerContent;
      const words = (c.words ?? []).filter((w) => w.word || w.definition);
      if (words.length === 0) return <Empty />;
      return (
        <dl className="flex flex-col gap-3">
          {words.map((w, i) => (
            <div
              key={i}
              className="bg-nc-surface rounded-xl border border-nc-grey p-3"
            >
              <dt className="text-sm font-semibold text-nc-charcoal">
                {w.word || "—"}
              </dt>
              {w.definition && (
                <dd className="text-sm text-nc-charcoal/70 mt-1 whitespace-pre-wrap">
                  {w.definition}
                </dd>
              )}
            </div>
          ))}
        </dl>
      );
    }
    case "reading_notes": {
      const c = content as ReadingNotesContent;
      const text = c.notes || card.raw_ocr_text || "";
      if (!text) return <Empty />;
      return (
        <div>
          <p className="text-xs font-semibold text-nc-green uppercase tracking-wider mb-1">
            Notes
          </p>
          <p className="text-sm text-nc-charcoal leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>
      );
    }
    case "general": {
      const c = content as GeneralContent;
      const html = c.notes || card.raw_ocr_text || "";
      if (!html) return <Empty />;
      return (
        <div>
          <p className="text-xs font-semibold text-nc-green uppercase tracking-wider mb-1">
            Notes
          </p>
          <div
            className="card-html-content text-sm text-nc-charcoal leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      );
    }
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-nc-green uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm text-nc-charcoal mt-0.5">{value}</p>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-nc-green uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-nc-charcoal leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-nc-charcoal/40 italic">No content yet.</p>;
}
