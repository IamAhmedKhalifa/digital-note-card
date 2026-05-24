"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CaptureFlow from "@/components/cards/capture/CaptureFlow";

export default function CapturePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) router.push("/login");
        else setUserId(data.user.id);
      });
  }, [router]);

  if (!userId) return null;

  return (
    <div className="px-4 pt-6 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-nc-charcoal/60 mb-6 hover:text-nc-charcoal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <CaptureFlow bookId={params.id} userId={userId} />
    </div>
  );
}
