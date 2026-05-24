import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/supabase/api";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthClient();
    if (auth.error) return auth.error;
    const { client: supabase, userId } = auth;

    const formData = await request.formData();
    const bookId = formData.get("bookId") as string;
    const cardType = formData.get("cardType") as string;
    const contentJson = formData.get("content") as string;
    const rawOcrText = (formData.get("rawOcrText") as string) || null;
    const frontFile = formData.get("front") as File | null;
    const backFile = formData.get("back") as File | null;

    const content = JSON.parse(contentJson);

    async function uploadImage(file: File, suffix: string): Promise<string> {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = userId + "/" + Date.now() + "_" + suffix + "." + ext;
      const { error } = await supabase.storage
        .from("card-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      return supabase.storage
        .from("card-images")
        .getPublicUrl(path).data.publicUrl;
    }

    const [frontUrl, backUrl] = await Promise.all([
      frontFile && frontFile.size > 0
        ? uploadImage(frontFile, "front")
        : Promise.resolve(null),
      backFile && backFile.size > 0
        ? uploadImage(backFile, "back")
        : Promise.resolve(null),
    ]);

    const { data: card, error: insertErr } = await supabase
      .from("cards")
      .insert({
        user_id: userId,
        book_id: bookId,
        card_type: cardType,
        front_image_url: frontUrl,
        back_image_url: backUrl,
        content,
        raw_ocr_text: rawOcrText,
        is_edited: true,
        sort_order: 0,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Bump book updated_at so library sorts correctly
    await supabase
      .from("books")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", bookId);

    return NextResponse.json({ card });
  } catch (err) {
    console.error("[POST /api/cards]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
