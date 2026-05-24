"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FlashcardView from "@/components/cards/FlashcardView";
import Button from "@/components/ui/Button";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import type { Card, Book } from "@/types/database";

export default function FlashcardsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

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

      if (!bookData) { router.push("/library"); return; }
      setBook(bookData as Book);
      // Shuffle for variety
      const shuffled = [...((cardData ?? []) as Card[])].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
    setDone(false);
  }

  function next() {
    if (index >= cards.length - 1) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function restart() {
    setCards((c) => [...c].sort(() => Math.random() - 0.5));
    setIndex(0);
    setDone(false);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <CardListSkeleton />
      </div>
    );
  }

  if (!book) return null;

  const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-nc-warmwhite">
      {/* Header */}
      <div className="bg-nc-green px-4 pt-12 pb-5">
        <button
          onClick={() => router.push(`/books/${params.id}`)}
          className="flex items-center gap-2 text-nc-warm/70 text-sm mb-3 hover:text-nc-warm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to book
        </button>
        <h1 className="text-lg font-semibold text-nc-warm leading-tight truncate">
          {book.title}
        </h1>
        <p className="text-sm text-nc-warm/60 mt-0.5">Flashcard review</p>
      </div>

      {cards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4 text-center">
          <p className="text-nc-charcoal/50 text-sm">No cards in this book yet.</p>
          <Button onClick={() => router.push(`/books/${params.id}`)}>
            Go back
          </Button>
        </div>
      ) : done ? (
        /* Completion screen */
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-nc-green/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-nc-green" />
          </div>
          <div>
            <p className="text-xl font-semibold text-nc-charcoal">All done!</p>
            <p className="text-sm text-nc-charcoal/50 mt-1">
              You reviewed all {cards.length} {cards.length === 1 ? "card" : "cards"}.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button fullWidth size="lg" onClick={restart}>
              Review again (shuffled)
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => router.push(`/books/${params.id}`)}
            >
              Back to book
            </Button>
          </div>
        </div>
      ) : (
        /* Review screen */
        <div className="flex-1 flex flex-col px-4 pt-5 pb-8 gap-5">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-nc-grey overflow-hidden">
              <div
                className="h-full bg-nc-green rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-nc-charcoal/40 tabular-nums shrink-0">
              {index + 1} / {cards.length}
            </span>
          </div>

          {/* Flashcard */}
          <FlashcardView key={cards[index].id} card={cards[index]} />

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={prev}
              disabled={index === 0}
              className="px-4"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button fullWidth size="lg" onClick={next}>
              {index >= cards.length - 1 ? "Finish" : "Next"}
              {index < cards.length - 1 && <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
