import { NextRequest, NextResponse } from "next/server";
import { extractWithGoogleVision } from "@/lib/ocr/google-vision";

export async function POST(request: NextRequest) {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Google Cloud Vision not configured" },
      { status: 503 }
    );
  }

  try {
    const { image } = await request.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing image field" },
        { status: 400 }
      );
    }

    const text = await extractWithGoogleVision(image);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
