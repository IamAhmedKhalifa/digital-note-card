"use client";
import RichTextEditor from "@/components/ui/RichTextEditor";
import type { GeneralContent } from "@/types/cards";

interface Props {
  content: GeneralContent;
  onChange: (content: GeneralContent) => void;
}

export default function GeneralNotesEditor({ content, onChange }: Props) {
  return (
    <RichTextEditor
      content={content.notes}
      onChange={(html) => onChange({ notes: html })}
      placeholder="Anything you want to capture about this book..."
    />
  );
}
