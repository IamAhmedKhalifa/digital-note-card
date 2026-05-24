"use client";
import { Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { CharacterTrackerContent } from "@/types/cards";

interface Props {
  content: CharacterTrackerContent;
  onChange: (content: CharacterTrackerContent) => void;
}

export default function CharacterTrackerEditor({ content, onChange }: Props) {
  const characters = content.characters ?? [{ name: "", role_traits: "" }];

  function updateCharacter(idx: number, key: "name" | "role_traits", value: string) {
    const updated = characters.map((c, i) =>
      i === idx ? { ...c, [key]: value } : c
    );
    onChange({ ...content, characters: updated });
  }

  function addCharacter() {
    onChange({ ...content, characters: [...characters, { name: "", role_traits: "" }] });
  }

  function removeCharacter(idx: number) {
    const updated = characters.filter((_, i) => i !== idx);
    onChange({ ...content, characters: updated.length > 0 ? updated : [{ name: "", role_traits: "" }] });
  }

  return (
    <div className="flex flex-col gap-5">
      {characters.map((char, idx) => (
        <div
          key={idx}
          className="bg-nc-surface rounded-xl p-4 border border-nc-grey flex flex-col gap-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                label="Name"
                placeholder="Character name"
                value={char.name}
                onChange={(e) => updateCharacter(idx, "name", e.target.value)}
              />
            </div>
            {characters.length > 1 && (
              <button
                type="button"
                onClick={() => removeCharacter(idx)}
                className="mt-7 p-1.5 text-nc-charcoal/40 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <Textarea
            label="Role / traits"
            placeholder="Their role in the story, key traits, relationships..."
            value={char.role_traits}
            onChange={(e) => updateCharacter(idx, "role_traits", e.target.value)}
            rows={2}
          />
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addCharacter}>
        <Plus className="w-4 h-4" />
        Add character
      </Button>

      <Textarea
        label="Character notes"
        placeholder="Themes across characters, relationships, arcs..."
        value={content.character_notes}
        onChange={(e) => onChange({ ...content, character_notes: e.target.value })}
        rows={3}
      />
    </div>
  );
}
