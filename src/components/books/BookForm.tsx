"use client";
import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, X, Trash2, Search, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import TagInput from "@/components/ui/TagInput";
import type { Book } from "@/types/database";
import type { CoverResult } from "@/app/api/books/cover-search/route";

interface BookFormProps {
  book?: Book;
  userId: string;
}

export default function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [tags, setTags] = useState<string[]>(book?.tags ?? []);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(book?.cover_image_url ?? "");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Cover search
  const [searching, setSearching] = useState(false);
  const [coverResults, setCoverResults] = useState<CoverResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverUrl("");
    setCoverPreview(URL.createObjectURL(file));
    setShowResults(false);
  }

  function removeCover() {
    setCoverFile(null);
    setCoverUrl("");
    setCoverPreview("");
    setCoverResults([]);
    setShowResults(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function selectCoverResult(result: CoverResult) {
    setCoverUrl(result.coverUrl);
    setCoverFile(null);
    setCoverPreview(result.coverUrl);
    if (!title) setTitle(result.title);
    if (!author) setAuthor(result.author);
    setShowResults(false);
  }

  async function searchCovers() {
    const query = [title, author].filter(Boolean).join(" ");
    if (!query.trim()) {
      setError("Enter a title or author first so we know what to search for.");
      return;
    }
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/books/cover-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCoverResults(data.results ?? []);
      setShowResults(true);
    } catch {
      setError("Could not reach Open Library. Try uploading a photo instead.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("author", author.trim());
      fd.append("tags", JSON.stringify(tags));
      if (coverFile) {
        fd.append("cover", coverFile);
      } else if (coverUrl) {
        fd.append("coverUrl", coverUrl);
      }

      let res: Response;
      if (book) {
        fd.append("existingCoverUrl", book.cover_image_url ?? "");
        fd.append("removeCover", (!coverPreview && !coverFile && !coverUrl).toString());
        res = await fetch(`/api/books/${book.id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch("/api/books", { method: "POST", body: fd });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      if (book) {
        router.push(`/books/${book.id}`);
      } else {
        const data = await res.json();
        router.push(`/books/${data.book.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!book) return;
    if (!confirm(`Delete "${book.title}" and all its cards? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete book.");
      setDeleting(false);
      return;
    }
    router.push("/library");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Cover image */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-nc-charcoal">Book cover</p>

        {coverPreview ? (
          <div className="relative w-32 rounded-xl overflow-hidden border border-nc-grey">
            <Image
              src={coverPreview}
              alt="Cover preview"
              width={128}
              height={192}
              className="w-full h-auto object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={removeCover}
              className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
            >
              <X className="w-3.5 h-3.5 text-nc-charcoal" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-sm text-nc-green border border-dashed border-nc-green/40 rounded-xl px-4 py-3 hover:bg-nc-green/5 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Upload photo
              </button>
              <button
                type="button"
                onClick={searchCovers}
                disabled={searching}
                className="flex items-center gap-2 text-sm text-nc-charcoal/70 border border-dashed border-nc-grey rounded-xl px-4 py-3 hover:bg-nc-grey/20 transition-colors disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search covers
              </button>
            </div>

            {/* Open Library results */}
            {showResults && coverResults.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-nc-charcoal/50">Tap a cover to use it</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {coverResults.map((r) => (
                    <button
                      key={r.coverId}
                      type="button"
                      onClick={() => selectCoverResult(r)}
                      title={`${r.title} — ${r.author}`}
                      className="shrink-0 w-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-nc-green transition-colors"
                    >
                      <Image
                        src={r.coverUrl}
                        alt={r.title}
                        width={80}
                        height={120}
                        className="w-full h-auto"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showResults && coverResults.length === 0 && (
              <p className="text-xs text-nc-charcoal/50">
                No covers found — try a different title or upload your own.
              </p>
            )}
          </>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <Input
        label="Title"
        placeholder="Book title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Input
        label="Author (optional)"
        placeholder="Author name"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-nc-charcoal">
          Tags <span className="text-nc-charcoal/40 font-normal">(optional)</span>
        </p>
        <TagInput
          tags={tags}
          onChange={setTags}
          placeholder="e.g. leadership, mindset, fiction"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth loading={loading} size="lg">
          {book ? "Save changes" : "Add book"}
        </Button>
        {book && (
          <Button type="button" variant="danger" fullWidth loading={deleting} size="lg" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Delete book
          </Button>
        )}
        <Button type="button" variant="ghost" fullWidth onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
