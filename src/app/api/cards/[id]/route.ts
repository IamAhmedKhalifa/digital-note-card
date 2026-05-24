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
    const { client: supabase } = auth;

    const body = await request.json();
    const { content } = body;

    const patch: Record<string, unknown> = { is_edited: true };
    if (content !== undefined) patch.content = content;

    const { error } = await supabase
      .from("cards")
      .update(patch)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/cards/[id]]", err);
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

    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/cards/[id]]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
