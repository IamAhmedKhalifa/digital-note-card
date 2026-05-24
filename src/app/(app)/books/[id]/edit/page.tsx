"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BookForm from "@/components/books/BookForm";
import { SpinnerOverlay } from "@/components/ui/Spinner";
import type { Book } from "@/types/database";

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (!data) { router.push("/library"); return; }
      setBook(data as Book);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  if (loading) return <SpinnerOverlay />;

  return (
    <div className="px-4 pt-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-nc-charcoal/60 mb-6 hover:text-nc-charcoal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <h1 className="text-xl font-semibold text-nc-charcoal mb-6">Edit book</h1>
      <BookForm book={book!} userId={userId!} />
    </div>
  );
}
