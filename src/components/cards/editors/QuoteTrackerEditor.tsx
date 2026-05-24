"use client";
import { Textarea } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import type { QuoteTrackerContent } from "@/types/cards";

interface Props {
  content: QuoteTrackerContent;
  onChange: (content: QuoteTrackerContent) => void;
}

export default function QuoteTrackerEditor({ content, onChange }: Props) {
  const set = (key: keyof QuoteTrackerContent, value: string) =>
    onChange({ ...content, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label="Quote"
        placeholder="The exact words..."
        value={content.quote}
        onChange={(e) => set("quote", e.target.value)}
        rows={4}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Author / source"
            placeholder="e.g. Viktor Frankl, p. 42"
            value={content.book_author}
            onChange={(e) => set("book_author", e.target.value)}
          />
        </div>
        <div className="w-32">
          <Input
            label="Date noted"
            placeholder="e.g. Jan 2025"
            value={content.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
      </div>

      <Textarea
        label="Reflection"
        placeholder="Why does this quote matter to you?"
        value={content.reflection}
        onChange={(e) => set("reflection", e.target.value)}
        rows={3}
      />
    </div>
  );
}
