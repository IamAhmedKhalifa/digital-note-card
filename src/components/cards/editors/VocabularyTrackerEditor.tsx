"use client";
import { Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { VocabularyTrackerContent } from "@/types/cards";

interface Props {
  content: VocabularyTrackerContent;
  onChange: (content: VocabularyTrackerContent) => void;
}

export default function VocabularyTrackerEditor({ content, onChange }: Props) {
  const words = content.words ?? [{ word: "", definition: "" }];

  function updateWord(idx: number, key: "word" | "definition", value: string) {
    const updated = words.map((w, i) =>
      i === idx ? { ...w, [key]: value } : w
    );
    onChange({ words: updated });
  }

  function addWord() {
    onChange({ words: [...words, { word: "", definition: "" }] });
  }

  function removeWord(idx: number) {
    const updated = words.filter((_, i) => i !== idx);
    onChange({ words: updated.length > 0 ? updated : [{ word: "", definition: "" }] });
  }

  return (
    <div className="flex flex-col gap-4">
      {words.map((w, idx) => (
        <div
          key={idx}
          className="bg-nc-surface rounded-xl p-4 border border-nc-grey flex flex-col gap-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                label="Word"
                placeholder="New word"
                value={w.word}
                onChange={(e) => updateWord(idx, "word", e.target.value)}
              />
            </div>
            {words.length > 1 && (
              <button
                type="button"
                onClick={() => removeWord(idx)}
                className="mt-7 p-1.5 text-nc-charcoal/40 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <Textarea
            label="Definition"
            placeholder="What does it mean?"
            value={w.definition}
            onChange={(e) => updateWord(idx, "definition", e.target.value)}
            rows={2}
          />
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addWord}>
        <Plus className="w-4 h-4" />
        Add word
      </Button>
    </div>
  );
}
