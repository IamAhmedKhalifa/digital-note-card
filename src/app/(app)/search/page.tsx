"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SpinnerOverlay } from "@/components/ui/Spinner";
import type { CardWithBook, Book } from "@/types/database";
import { CARD_TYPE_LABELS, CARD_TYPE_ORDER, type CardType } from "@/types/cards";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardWithBook[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [bookFilter, setBookFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<CardType | "">("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadFilters() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load books (for book filter) — tags come from books now
      const { data: bookData } = await supabase
        .from("books")
        .select("id, title, author, user_id, cover_image_url, tags, created_at, updated_at")
        .eq("user_id", user.id)
        .order("title");

      if (bookData) {
        setBooks(bookData as Book[]);
        // Collect all unique tags from books
        const tagSet = new Set<string>();
        (bookData as Book[]).forEach((b) =>
          (b.tags ?? []).forEach((t) => tagSet.add(t))
        );
        setAllTags([...tagSet].sort());
      }
    }
    loadFilters();
    inputRef.current?.focus();
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // If filtering by book tag, first resolve which book IDs have that tag
    let bookIds: string[] | null = null;
    if (tagFilter) {
      const { data: taggedBooks } = await supabase
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .contains("tags", [tagFilter]);
      bookIds = (taggedBooks ?? []).map((b: { id: string }) => b.id);
      // No books with that tag → no results
      if (bookIds.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }
    }

    let q = supabase
      .from("cards")
      .select("*, books(id, title)")
      .eq("user_id", user.id)
      .textSearch("search_vector", query.trim(), { type: "plain", config: "english" });

    if (bookFilter) q = q.eq("book_id", bookFilter);
    if (bookIds) q = q.in("book_id", bookIds);
    if (typeFilter) q = q.eq("card_type", typeFilter);

    const { data } = await q.limit(50);
    setResults((data ?? []) as CardWithBook[]);
    setLoading(false);
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-nc-charcoal mb-4">Search</h1>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nc-charcoal/40" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes..."
            className="
              w-full pl-10 pr-10 py-3 rounded-xl border border-nc-grey bg-white
              text-sm text-nc-charcoal placeholder:text-nc-charcoal/40
              focus:outline-none focus:ring-2 focus:ring-nc-green/40 focus:border-nc-green
            "
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-nc-charcoal/40 hover:text-nc-charcoal transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-full border border-nc-grey bg-white text-nc-charcoal/70 focus:outline-none focus:ring-2 focus:ring-nc-green/40"
          >
            <option value="">All books</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>

          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-full border border-nc-grey bg-white text-nc-charcoal/70 focus:outline-none focus:ring-2 focus:ring-nc-green/40"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CardType | "")}
            className="text-xs px-3 py-1.5 rounded-full border border-nc-grey bg-white text-nc-charcoal/70 focus:outline-none focus:ring-2 focus:ring-nc-green/40"
            aria-label="Card type filter"
          >
            <option value="">All card types</option>
            {CARD_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {CARD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="text-xs px-4 py-1.5 rounded-full bg-nc-green text-nc-warm font-medium hover:bg-[#243829] transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <SpinnerOverlay />
        ) : searched && results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-nc-charcoal/50 text-sm">
              No results for &ldquo;{query}&rdquo;
              {typeFilter && <span> in <strong>{CARD_TYPE_LABELS[typeFilter]}</strong></span>}
              {tagFilter && <span> in books tagged <strong>#{tagFilter}</strong></span>}
            </p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-xs text-nc-charcoal/40 mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {typeFilter && <span> · {CARD_TYPE_LABELS[typeFilter]}</span>}
              {tagFilter && <span> · #{tagFilter}</span>}
            </p>
            <div className="bg-nc-surface rounded-2xl border border-nc-grey overflow-hidden">
              {results.map((card, i) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className={`
                    flex items-center gap-3 px-4 py-3
                    hover:bg-nc-grey/30 transition-colors
                    ${i < results.length - 1 ? "border-b border-nc-grey" : ""}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-nc-green shrink-0">
                        {CARD_TYPE_LABELS[card.card_type]}
                      </span>
                      {card.books && (
                        <span className="text-xs text-nc-charcoal/40 truncate">
                          · {card.books.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-nc-charcoal leading-snug line-clamp-2">
                      {getSnippet(card)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-nc-charcoal/30 shrink-0" />
                </Link>
              ))}
            </div>
          </>
        ) : !searched ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-nc-charcoal/20 mx-auto mb-3" />
            <p className="text-nc-charcoal/40 text-sm">
              Search across all your notes.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getSnippet(card: CardWithBook): string {
  const c = card.content as unknown as Record<string, unknown> | null;
  let text = "";

  switch (card.card_type) {
    case "chapter_tracker": {
      const x = (c ?? {}) as {
        chapter?: string;
        main_points?: string;
        learnings_to_apply?: string;
      };
      text = [x.chapter, x.main_points, x.learnings_to_apply]
        .filter(Boolean)
        .join(" — ");
      break;
    }
    case "quote_tracker": {
      const x = (c ?? {}) as { quote?: string; reflection?: string };
      text = x.quote ? `"${x.quote}"` : x.reflection ?? "";
      break;
    }
    case "character_tracker": {
      const x = (c ?? {}) as {
        characters?: Array<{ name?: string; role_traits?: string }>;
        character_notes?: string;
      };
      const names = (x.characters ?? [])
        .map((ch) => ch.name)
        .filter(Boolean)
        .join(", ");
      text = names || x.character_notes || "";
      break;
    }
    case "vocabulary_tracker": {
      const x = (c ?? {}) as {
        words?: Array<{ word?: string; definition?: string }>;
      };
      text = (x.words ?? [])
        .map((w) => (w.word && w.definition ? `${w.word}: ${w.definition}` : w.word || ""))
        .filter(Boolean)
        .join(" · ");
      break;
    }
    case "reading_notes":
    case "general": {
      const x = (c ?? {}) as { notes?: string };
      text = x.notes ?? "";
      break;
    }
  }

  if (!text) text = card.raw_ocr_text ?? "";
  return stripHtml(text).slice(0, 120) || "—";
}
