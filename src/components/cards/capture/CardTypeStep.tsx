"use client";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import type { CardType } from "@/types/cards";
import { CARD_TYPE_LABELS, CARD_TYPE_ORDER } from "@/types/cards";

const CARD_TYPE_DESCRIPTIONS: Record<CardType, string> = {
  chapter_tracker: "Chapter, pages, main points, learnings",
  quote_tracker: "Quote, author, reflection, date",
  character_tracker: "Character names, roles, traits",
  vocabulary_tracker: "New words and definitions",
  reading_notes: "Freeform notes from reading",
  general: "General observations and thoughts",
};

interface CardTypeStepProps {
  selected: CardType;
  autoDetected?: CardType | null;
  onSelect: (type: CardType) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CardTypeStep({
  selected,
  autoDetected,
  onSelect,
  onNext,
  onBack,
}: CardTypeStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-nc-charcoal">Card type</h2>
        <p className="text-sm text-nc-charcoal/60 mt-1">
          {autoDetected
            ? `We detected this is a ${CARD_TYPE_LABELS[autoDetected]}. Confirm or change below.`
            : "Select the type that matches your notecard."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {CARD_TYPE_ORDER.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`
              flex items-center gap-3 p-4 rounded-xl border text-left
              transition-all duration-150
              ${
                selected === type
                  ? "border-nc-green bg-nc-green/5"
                  : "border-nc-grey hover:border-nc-green/40 hover:bg-nc-surface"
              }
            `}
          >
            <div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                ${selected === type ? "border-nc-green bg-nc-green" : "border-nc-grey"}
              `}
            >
              {selected === type && (
                <Check className="w-3 h-3 text-nc-warm" strokeWidth={3} />
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${selected === type ? "text-nc-green" : "text-nc-charcoal"}`}>
                {CARD_TYPE_LABELS[type]}
              </p>
              <p className="text-xs text-nc-charcoal/50 mt-0.5">
                {CARD_TYPE_DESCRIPTIONS[type]}
              </p>
            </div>
            {type === autoDetected && (
              <span className="ml-auto text-xs bg-nc-gold/15 text-nc-gold px-2 py-0.5 rounded-full font-medium">
                Detected
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button fullWidth size="lg" onClick={onNext}>
          Continue
        </Button>
        <Button fullWidth variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
