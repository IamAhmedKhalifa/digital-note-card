import { NextRequest, NextResponse } from "next/server";

export interface CoverResult {
  title: string;
  author: string;
  coverId: number;
  coverUrl: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=title,author_name,cover_i&limit=8`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Open Library request failed");

    const data = await res.json();
    const results: CoverResult[] = (data.docs ?? [])
      // Only keep books that have a cover image
      .filter((d: { cover_i?: number }) => d.cover_i)
      .slice(0, 6)
      .map((d: { title?: string; author_name?: string[]; cover_i: number }) => ({
        title: d.title ?? "",
        author: d.author_name?.[0] ?? "",
        coverId: d.cover_i,
        coverUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`,
      }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[GET /api/books/cover-search]", err);
    return NextResponse.json({ results: [] });
  }
}
