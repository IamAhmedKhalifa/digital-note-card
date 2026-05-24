"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CardDetail from "@/components/cards/CardDetail";
import { SpinnerOverlay } from "@/components/ui/Spinner";
import type { Card } from "@/types/database";

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("cards")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (!data) { router.back(); return; }
      setCard(data as Card);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  if (loading) return <SpinnerOverlay />;
  if (!card) return null;

  return (
    <div className="px-4 pt-6 pb-8">
      <button
        onClick={() => router.push(`/books/${card.book_id}`)}
        className="flex items-center gap-2 text-sm text-nc-charcoal/60 mb-6 hover:text-nc-charcoal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to book
      </button>

      <CardDetail card={card} />
    </div>
  );
}
