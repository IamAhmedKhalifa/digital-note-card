"use client";
import { useState } from "react";
import { AlertTriangle, Info, BookOpen, Copy } from "lucide-react";
import ImageZoom from "@/components/ui/ImageZoom";
import Button from "@/components/ui/Button";
import GeneralNotesEditor from "@/components/cards/editors/GeneralNotesEditor";
import ChapterTrackerEditor from "@/components/cards/editors/ChapterTrackerEditor";
import QuoteTrackerEditor from "@/components/cards/editors/QuoteTrackerEditor";
import CharacterTrackerEditor from "@/components/cards/editors/CharacterTrackerEditor";
import VocabularyTrackerEditor from "@/components/cards/editors/VocabularyTrackerEditor";
import ReadingNotesEditor from "@/components/cards/editors/ReadingNotesEditor";
import {
  CARD_TYPE_LABELS,
  type CardContent,
  type CardType,
  type ChapterTrackerContent,
  type QuoteTrackerContent,
  type CharacterTrackerContent,
  type VocabularyTrackerContent,
  type ReadingNotesContent,
  type GeneralContent,
} from "@/types/cards";

export type SaveMode = "single" | "double";

interface OcrReviewStepProps {
  cardType: CardType;
  content: CardContent;
  frontPreview: string | null;
  backPreview: string | null;
  frontOcrText: string;
  backOcrText: string;
  ocrFailed: boolean;
  onContentChange: (content: CardContent) => void;
  /** Called with the chosen save mode, the final content (for structured types)
   *  and the raw front/back text (used when saving free-form types as 2 cards) */
  onSave: (
    mode: SaveMode,
    finalContent: CardContent,
    frontText: string,
    backText: string
  ) => void;
  onBack: () => void;
  saving: boolean;
}

export default function OcrReviewStep({
  cardType,
  content,
  frontPreview,
  backPreview,
  frontOcrText,
  backOcrText,
  ocrFailed,
  onContentChange,
  onSave,
  onBack,
  saving,
}: OcrReviewStepProps) {
  const hasBothSides = !!(frontPreview && backPreview);
  const [activeTab, setActiveTab] = useState<"front" | "back">("front");

  // For free-form types we keep per-side text so the "save as two notes"
  // option can split them. For structured types only the combined `content`
  // matters; per-side text is only used when reverting / re-OCRing.
  const isFreeForm = cardType === "general" || cardType === "reading_notes";
  const [frontNotes, setFrontNotes] = useState(frontOcrText);
  const [backNotes, setBackNotes] = useState(backOcrText);

  function combine(front: string, back: string): string {
    return [front, back].filter((t) => t.trim()).join("\n\n");
  }

  // Free-form: edits go into per-side notes; combined value lives in `content`
  function handleFreeFormFrontChange(c: CardContent) {
    const text = (c as GeneralContent).notes;
    setFrontNotes(text);
    onContentChange({ notes: combine(text, backNotes) });
  }
  function handleFreeFormBackChange(c: CardContent) {
    const text = (c as GeneralContent).notes;
    setBackNotes(text);
    onContentChange({ notes: combine(frontNotes, text) });
  }

  const activeNotes = activeTab === "front" ? frontNotes : backNotes;
  const handleFreeFormChange =
    activeTab === "front" ? handleFreeFormFrontChange : handleFreeFormBackChange;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-nc-charcoal">Review & edit</h2>
        <p className="text-sm text-nc-charcoal/60 mt-1">
          Check the text below and correct anything that was misread.
        </p>
        <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-nc-green/10 text-nc-green">
          {CARD_TYPE_LABELS[cardType]}
        </span>
      </div>

      {/* Image preview with segmented Front/Back tabs */}
      {(frontPreview || backPreview) && (
        <div className="flex flex-col gap-0">
          {hasBothSides && (
            <div className="flex rounded-t-2xl overflow-hidden border border-b-0 border-nc-grey">
              <button
                onClick={() => setActiveTab("front")}
                className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all ${
                  activeTab === "front"
                    ? "bg-nc-green text-nc-warm"
                    : "bg-nc-surface text-nc-charcoal/50 hover:bg-nc-grey/40 hover:text-nc-charcoal"
                }`}
              >
                Front
              </button>
              <div className="w-px bg-nc-grey" />
              <button
                onClick={() => setActiveTab("back")}
                className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all ${
                  activeTab === "back"
                    ? "bg-nc-green text-nc-warm"
                    : "bg-nc-surface text-nc-charcoal/50 hover:bg-nc-grey/40 hover:text-nc-charcoal"
                }`}
              >
                Back
              </button>
            </div>
          )}
          <div
            className={
              hasBothSides
                ? "rounded-b-2xl overflow-hidden border border-nc-grey"
                : ""
            }
          >
            <ImageZoom
              src={
                activeTab === "front" && frontPreview
                  ? frontPreview
                  : backPreview ?? frontPreview!
              }
              alt="Notes photo"
            />
          </div>
        </div>
      )}

      {/* OCR status notice */}
      {ocrFailed ? (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            We could not read the handwriting on this card. You can type in the
            content manually below.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 bg-nc-green/5 border border-nc-green/20 rounded-xl p-3">
          <Info className="w-5 h-5 text-nc-green shrink-0 mt-0.5" />
          <p className="text-sm text-nc-charcoal/70">
            Text pre-filled from your handwriting — edit anything that needs
            correcting.
            {isFreeForm && hasBothSides &&
              " Tap Front / Back above to switch sides."}
          </p>
        </div>
      )}

      {/* Editor — structured for typed cards, per-side notes for free-form */}
      <div className="flex flex-col gap-2">
        {isFreeForm && hasBothSides && (
          <p className="text-xs font-semibold text-nc-green uppercase tracking-wider">
            {activeTab === "front" ? "Front" : "Back"} notes
          </p>
        )}

        {isFreeForm ? (
          cardType === "reading_notes" ? (
            <ReadingNotesEditor
              key={activeTab}
              content={{ notes: activeNotes }}
              onChange={handleFreeFormChange}
            />
          ) : (
            <GeneralNotesEditor
              key={activeTab}
              content={{ notes: activeNotes }}
              onChange={handleFreeFormChange}
            />
          )
        ) : cardType === "chapter_tracker" ? (
          <ChapterTrackerEditor
            content={content as ChapterTrackerContent}
            onChange={onContentChange}
          />
        ) : cardType === "quote_tracker" ? (
          <QuoteTrackerEditor
            content={content as QuoteTrackerContent}
            onChange={onContentChange}
          />
        ) : cardType === "character_tracker" ? (
          <CharacterTrackerEditor
            content={content as CharacterTrackerContent}
            onChange={onContentChange}
          />
        ) : cardType === "vocabulary_tracker" ? (
          <VocabularyTrackerEditor
            content={content as VocabularyTrackerContent}
            onChange={onContentChange}
          />
        ) : null}
      </div>

      {/* Save options */}
      <div className="flex flex-col gap-3">
        {isFreeForm && hasBothSides ? (
          <>
            <p className="text-xs text-nc-charcoal/50 text-center">
              How would you like to save these notes?
            </p>
            <Button
              fullWidth
              size="lg"
              loading={saving}
              onClick={() =>
                onSave(
                  "single",
                  { notes: combine(frontNotes, backNotes) } as ReadingNotesContent,
                  frontNotes,
                  backNotes
                )
              }
            >
              <BookOpen className="w-4 h-4" />
              Save as one note
            </Button>
            <Button
              fullWidth
              variant="secondary"
              loading={saving}
              onClick={() =>
                onSave(
                  "double",
                  { notes: combine(frontNotes, backNotes) } as ReadingNotesContent,
                  frontNotes,
                  backNotes
                )
              }
            >
              <Copy className="w-4 h-4" />
              Save as two separate notes
            </Button>
          </>
        ) : (
          <Button
            fullWidth
            size="lg"
            loading={saving}
            onClick={() => onSave("single", content, frontNotes, backNotes)}
          >
            Save card
          </Button>
        )}
        <Button fullWidth variant="ghost" onClick={onBack} disabled={saving}>
          Back
        </Button>
      </div>
    </div>
  );
}
