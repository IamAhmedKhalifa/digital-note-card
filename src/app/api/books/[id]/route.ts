import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/supabase/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthClient();
    if (auth.error) return auth.error;
    const { client: supabase, userId } = auth;

    const formData = await request.formData();
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim() || null;
    const coverFile = formData.get("cover") as File | null;
    const removeCover = formData.get("removeCover") === "true";
    const existingCoverUrl =
      (formData.get("existingCoverUrl") as string) || null;
    const tagsJson = (formData.get("tags") as string) || "[]";
    const tags: string[] = JSON.parse(tagsJson);

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    let coverUrl: string | null = existingCoverUrl;

    if (removeCover) {
      coverUrl = null;
    } else if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("book-covers")
        .upload(path, coverFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      coverUrl = supabase.storage
        .from("book-covers")
        .getPublicUrl(path).data.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from("books")
      .update({ title, author, cover_image_url: coverUrl, tags })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/books/[id]]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthClient();
    if (auth.error) return auth.error;
    const { client: supabase } = auth;

    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/books/[id]]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
