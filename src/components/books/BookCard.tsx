"use client";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import type { BookWithCount } from "@/types/database";

interface BookCardProps {
  book: BookWithCount;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="group block bg-nc-surface rounded-2xl overflow-hidden border border-nc-grey hover:border-nc-green/40 hover:shadow-md transition-all duration-200"
    >
      {/* Cover */}
      <div className="aspect-[3/4] bg-nc-grey/30 relative overflow-hidden">
        {book.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-nc-green/5">
            <BookOpen className="w-8 h-8 text-nc-green/30" />
          </div>
        )}

        {/* Card count badge */}
        <div className="absolute bottom-2 right-2 bg-nc-green/90 text-nc-warm text-xs font-medium px-2 py-0.5 rounded-full">
          {book.card_count} {book.card_count === 1 ? "card" : "cards"}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-nc-charcoal leading-snug line-clamp-2">
          {book.title}
        </p>
        {book.author && (
          <p className="text-xs text-nc-charcoal/50 mt-0.5 line-clamp-1">{book.author}</p>
        )}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {book.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-nc-green/10 text-nc-green font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
