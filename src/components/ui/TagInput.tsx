"use client";
import { useState, KeyboardEvent } from "react";
import { X, Tag } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = "Add a tag…",
  label = "Tags",
}: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-nc-charcoal flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-nc-green" />
          {label}
        </label>
      )}

      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-nc-grey bg-white focus-within:ring-2 focus-within:ring-nc-green/40 focus-within:border-nc-green transition-colors min-h-[44px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-nc-green/10 text-nc-green text-xs font-medium px-2 py-1 rounded-lg"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-nc-charcoal transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm text-nc-charcoal placeholder:text-nc-charcoal/40 bg-transparent focus:outline-none"
        />
      </div>
      <p className="text-xs text-nc-charcoal/40">
        Press Enter or comma to add · e.g. leadership, mindset
      </p>
    </div>
  );
}
