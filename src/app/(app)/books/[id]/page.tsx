"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Edit2,
  Camera,
  PenLine,
  Share2,
  BookOpen,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CardList from "@/components/cards/CardList";
import ExportModal from "@/components/export/ExportModal";
import Button from "@/components/ui/Button";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import type { Book, Card } from "@/types/database";

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  // AI summary state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: bookData }, { data: cardData }] = await Promise.all([
        supabase
          .from("books")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("cards")
          .select("*")
          .eq("book_id", params.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (!bookData) {
        router.push("/library");
        return;
      }
      setBook(bookData as Book);
      setCards((cardData ?? []) as Card[]);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  async function handleGenerateSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
      const res = await fetch(`/api/books/${params.id}/summary`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate summary");
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        {/* Skeleton header */}
        <div className="bg-nc-green px-4 pt-12 pb-6">
          <div className="h-4 w-16 rounded-full bg-nc-warm/20 mb-4" />
          <div className="flex gap-4">
            <div className="w-20 h-28 rounded-xl bg-nc-warm/10 shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-5 w-3/4 rounded-full bg-nc-warm/20" />
              <div className="h-3 w-1/2 rounded-full bg-nc-warm/10" />
              <div className="h-3 w-1/4 rounded-full bg-nc-warm/10 mt-1" />
            </div>
          </div>
        </div>
        <div className="px-4 pt-6">
          <CardListSkeleton />
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div>
      {/* Header */}
      <div className="bg-nc-green px-4 pt-12 pb-6">
        <button
          onClick={() => router.push("/library")}
          className="flex items-center gap-2 text-nc-warm/80 text-sm mb-4 hover:text-nc-warm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Library
        </button>

        <div className="flex gap-4">
          {/* Cover */}
          <div className="w-20 h-28 rounded-xl overflow-hidden bg-nc-warm/10 shrink-0">
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                width={80}
                height={112}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-nc-warm/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-nc-warm leading-tight">
              {book.title}
            </h1>
            {book.author && (
              <p className="text-sm text-nc-warm/80 mt-0.5">{book.author}</p>
            )}
            {book.tags && book.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5" role="list" aria-label="Book tags">
                {book.tags.map((t) => (
                  <span
                    key={t}
                    role="listitem"
                    className="text-xs px-2 py-0.5 rounded-full bg-nc-warm/20 text-nc-warm font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-nc-warm/80 mt-2">
              {cards.length} {cards.length === 1 ? "card" : "cards"}
            </p>

            <div className="flex gap-2 mt-3 flex-wrap">
              <Link href={`/books/${book.id}/edit`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-nc-charcoal bg-nc-warm/90"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </Link>

              {cards.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-nc-charcoal bg-nc-warm/90"
                    onClick={() =>
                      router.push(`/books/${book.id}/flashcards`)
                    }
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Flashcards
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-nc-charcoal bg-nc-warm/90"
                    onClick={() => {
                      setSummaryOpen(true);
                      if (!summary && !summaryLoading) handleGenerateSummary();
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Summary
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-nc-charcoal bg-nc-warm/90"
                    onClick={() => setExportOpen(true)}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="pt-6 pb-4">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-nc-green/10 flex items-center justify-center">
              <Camera className="w-7 h-7 text-nc-green/40" />
            </div>
            <div>
              <p className="font-medium text-nc-charcoal">No cards yet</p>
              <p className="text-sm text-nc-charcoal/75 mt-1 max-w-xs">
                Capture a photo of your notes, or write directly.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/books/${book.id}/capture`}>
                <Button>
                  <Camera className="w-4 h-4" />
                  Capture card
                </Button>
              </Link>
              <Link href={`/books/${book.id}/write`}>
                <Button variant="secondary">
                  <PenLine className="w-4 h-4" />
                  Write a note
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <CardList cards={cards} bookId={book.id} />
            <div className="px-4 mt-6 flex gap-3">
              <Link href={`/books/${book.id}/capture`} className="flex-1">
                <Button fullWidth size="lg">
                  <Camera className="w-5 h-5" />
                  Capture card
                </Button>
              </Link>
              <Link href={`/books/${book.id}/write`} className="flex-1">
                <Button fullWidth size="lg" variant="secondary">
                  <PenLine className="w-5 h-5" />
                  Write a note
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Export modal */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        book={book}
        cards={cards}
      />

      {/* AI Summary modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-nc-grey">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-nc-green" />
                <h2 className="font-semibold text-nc-charcoal">AI Summary</h2>
              </div>
              <button
                onClick={() => setSummaryOpen(false)}
                className="p-1.5 rounded-full hover:bg-nc-grey/40 transition-colors"
              >
                <X className="w-4 h-4 text-nc-charcoal/75" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {summaryLoading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-3 rounded-full bg-nc-grey"
                      style={{ width: `${70 + (i % 3) * 10}%` }}
                    />
                  ))}
                  <p className="text-xs text-nc-charcoal/75 mt-2 text-center">
                    Claude is reading your notes…
                  </p>
                </div>
              ) : summaryError ? (
                <div className="text-center py-6">
                  <p role="alert" className="text-sm text-red-700">{summaryError}</p>
                  <button
                    className="mt-3 text-xs text-nc-green underline"
                    onClick={handleGenerateSummary}
                  >
                    Try again
                  </button>
                </div>
              ) : summary ? (
                <p className="text-sm text-nc-charcoal leading-relaxed whitespace-pre-wrap">
                  {summary}
                </p>
              ) : null}
            </div>

            {/* Modal footer */}
            {summary && (
              <div className="px-5 pb-5 pt-3 border-t border-nc-grey">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleGenerateSummary}
                  loading={summaryLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
