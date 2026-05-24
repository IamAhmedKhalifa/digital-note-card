import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/supabase/api";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthClient();
    if (auth.error) return auth.error;
    const { client: supabase, userId } = auth;

    const formData = await request.formData();
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim() || null;
    const coverFile = formData.get("cover") as File | null;
    const externalCoverUrl = (formData.get("coverUrl") as string) || null;
    const tagsJson = (formData.get("tags") as string) || "[]";
    const tags: string[] = JSON.parse(tagsJson);

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    let coverUrl: string | null = externalCoverUrl;

    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("book-covers")
        .upload(path, coverFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      coverUrl = supabase.storage
        .from("book-covers")
        .getPublicUrl(path).data.publicUrl;
    }

    const { data: book, error: insertErr } = await supabase
      .from("books")
      .insert({ user_id: userId, title, author, cover_image_url: coverUrl, tags })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ book });
  } catch (err) {
    console.error("[POST /api/books]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
