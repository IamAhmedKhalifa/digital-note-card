"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GeneralNotesEditor from "@/components/cards/editors/GeneralNotesEditor";
import Button from "@/components/ui/Button";
import type { CardContent } from "@/types/cards";

export default function WritePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState<CardContent>({ notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
    }
    checkAuth();
  }, [router]);

  async function handleSave() {
    const notes = (content as { notes: string }).notes;
    if (!notes || notes === "<p></p>") {
      return;
    }
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("bookId", params.id);
      fd.append("cardType", "general");
      fd.append("content", JSON.stringify(content));

      const res = await fetch("/api/cards", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      router.push(`/books/${params.id}`);
      router.refresh();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSaving(false);
    }
  }

  if (!userId) return null;

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Back */}
      <button
        onClick={() => router.push(`/books/${params.id}`)}
        className="flex items-center gap-2 text-nc-charcoal/50 text-sm mb-5 hover:text-nc-charcoal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to book
      </button>

      <h1 className="text-lg font-semibold text-nc-charcoal mb-1">
        Write a note
      </h1>
      <p className="text-sm text-nc-charcoal/50 mb-5">
        Type your thoughts, quotes, or observations.
      </p>

      <div className="flex flex-col gap-5">
        <GeneralNotesEditor content={content as { notes: string }} onChange={setContent} />

        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            size="lg"
            loading={saving}
            onClick={handleSave}
          >
            Save note
          </Button>
          <Button
            fullWidth
            variant="ghost"
            disabled={saving}
            onClick={() => router.push(`/books/${params.id}`)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
