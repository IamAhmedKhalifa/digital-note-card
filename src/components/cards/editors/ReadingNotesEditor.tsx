"use client";
import { Textarea } from "@/components/ui/Input";
import type { ReadingNotesContent } from "@/types/cards";

interface Props {
  content: ReadingNotesContent;
  onChange: (content: ReadingNotesContent) => void;
  label?: string;
  placeholder?: string;
}

export default function ReadingNotesEditor({
  content,
  onChange,
  label = "Reading notes",
  placeholder = "Your notes, thoughts, reactions, questions...",
}: Props) {
  return (
    <Textarea
      label={label}
      placeholder={placeholder}
      value={content.notes}
      onChange={(e) => onChange({ notes: e.target.value })}
      rows={10}
    />
  );
}
