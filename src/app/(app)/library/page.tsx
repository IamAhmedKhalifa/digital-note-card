"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BookGrid from "@/components/books/BookGrid";
import Button from "@/components/ui/Button";
import { LibrarySkeleton } from "@/components/ui/Skeleton";
import type { BookWithCount } from "@/types/database";

export default function LibraryPage() {
  const [books, setBooks] = useState<BookWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>("");

  useEffect(() => {
    async function fetchBooks() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("books")
        .select("*, cards(count)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) {
        const books: BookWithCount[] = data.map((b) => ({
          ...b,
          card_count: (b.cards as unknown as { count: number }[])?.[0]?.count ?? 0,
        }));
        setBooks(books);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  // Collect all unique tags from all books
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach((b) => (b.tags ?? []).forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [books]);

  // Filter books by active tag
  const filteredBooks = useMemo(() => {
    if (!activeTag) return books;
    return books.filter((b) => (b.tags ?? []).includes(activeTag));
  }, [books, activeTag]);

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-nc-charcoal">Your Library</h1>
          {!loading && (
            <p className="text-sm text-nc-charcoal/50 mt-0.5">
              {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
              {activeTag && <span className="text-nc-green"> · #{activeTag}</span>}
            </p>
          )}
        </div>
        <Link href="/books/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add book
          </Button>
        </Link>
      </div>

      {/* Tag filter chips */}
      {!loading && allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
          <button
            onClick={() => setActiveTag("")}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
              activeTag === ""
                ? "bg-nc-green text-nc-warm border-nc-green"
                : "bg-white text-nc-charcoal/60 border-nc-grey hover:border-nc-green/50"
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? "" : t)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                activeTag === t
                  ? "bg-nc-green text-nc-warm border-nc-green"
                  : "bg-white text-nc-charcoal/60 border-nc-grey hover:border-nc-green/50"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LibrarySkeleton />
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          {/* Illustrated empty state */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-nc-green/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-nc-green/40" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-nc-gold/20 flex items-center justify-center text-sm">
              ✨
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-nc-charcoal">
              Your library is empty
            </p>
            <p className="text-sm text-nc-charcoal/50 mt-1.5 max-w-[260px] leading-relaxed">
              Add a book and start capturing your handwritten notes — we'll
              read them for you.
            </p>
          </div>
          <Link href="/books/new">
            <Button size="lg">
              <Plus className="w-4 h-4" />
              Add your first book
            </Button>
          </Link>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-nc-charcoal/50 text-sm">No books tagged #{activeTag}.</p>
          <button
            className="text-xs text-nc-green underline"
            onClick={() => setActiveTag("")}
          >
            Clear filter
          </button>
        </div>
      ) : (
        <BookGrid books={filteredBooks} />
      )}
    </div>
  );
}
