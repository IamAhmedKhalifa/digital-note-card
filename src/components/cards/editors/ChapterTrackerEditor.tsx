"use client";
import { Textarea } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import type { ChapterTrackerContent } from "@/types/cards";

interface Props {
  content: ChapterTrackerContent;
  onChange: (content: ChapterTrackerContent) => void;
}

export default function ChapterTrackerEditor({ content, onChange }: Props) {
  const set = (key: keyof ChapterTrackerContent, value: string) =>
    onChange({ ...content, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Chapter"
            placeholder="e.g. Chapter 3 or Part Two"
            value={content.chapter}
            onChange={(e) => set("chapter", e.target.value)}
          />
        </div>
        <div className="w-28">
          <Input
            label="Pages"
            placeholder="e.g. 45–67"
            value={content.pages}
            onChange={(e) => set("pages", e.target.value)}
          />
        </div>
      </div>

      <Textarea
        label="Main points"
        placeholder="Key ideas, arguments, or takeaways from this chapter..."
        value={content.main_points}
        onChange={(e) => set("main_points", e.target.value)}
        rows={5}
      />

      <Textarea
        label="Learnings to apply"
        placeholder="What will you do differently because of this chapter?"
        value={content.learnings_to_apply}
        onChange={(e) => set("learnings_to_apply", e.target.value)}
        rows={3}
      />
    </div>
  );
}
