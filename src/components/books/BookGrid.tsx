import type { BookWithCount } from "@/types/database";
import BookCard from "./BookCard";

interface BookGridProps {
  books: BookWithCount[];
}

export default function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
