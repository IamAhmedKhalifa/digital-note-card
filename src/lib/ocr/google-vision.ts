/**
 * Google Cloud Vision — server-side only.
 * Called via /api/ocr route; never imported directly on the client.
 */
export async function extractWithGoogleVision(imageBase64: string): Promise<string> {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) throw new Error("GOOGLE_CLOUD_VISION_API_KEY not set");

  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;

  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
      },
    ],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GCV error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const response = data?.responses?.[0];

  // Parse block structure to reconstruct text with proper paragraph breaks.
  //
  // Strategy:
  //  - Sort blocks top-to-bottom (then left-to-right for blocks at similar heights).
  //    A dynamic threshold (half the average block height) determines whether two
  //    blocks are on the "same row" — this scales with image resolution, unlike a
  //    fixed pixel value.
  //  - Within each block keep GCV's native word order (it is already correct).
  //  - Use detectedBreak to emit spaces, real line-breaks, or hyphens between symbols.
  //  - Separate blocks with \n\n so cleanOcrText() can reflow each block into a
  //    flowing sentence.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages: any[] = response?.fullTextAnnotation?.pages ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function boundingTopY(obj: any): number {
    const verts: { y?: number }[] = obj?.boundingBox?.vertices ?? [];
    if (verts.length === 0) return 0;
    return Math.min(...verts.map((v) => v.y ?? 0));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function boundingLeftX(obj: any): number {
    const verts: { x?: number }[] = obj?.boundingBox?.vertices ?? [];
    if (verts.length === 0) return 0;
    return Math.min(...verts.map((v) => v.x ?? 0));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function boundingHeight(obj: any): number {
    const verts: { y?: number }[] = obj?.boundingBox?.vertices ?? [];
    if (verts.length < 2) return 0;
    const ys = verts.map((v) => v.y ?? 0);
    return Math.max(...ys) - Math.min(...ys);
  }

  if (pages.length > 0) {
    const blockTexts: string[] = [];

    for (const page of pages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBlocks: any[] = page.blocks ?? [];

      // Compute a dynamic line-height threshold from the average block height.
      // This scales naturally with image resolution so we never use a fixed px value.
      const avgBlockH =
        rawBlocks.length > 0
          ? rawBlocks.reduce((sum, b) => sum + boundingHeight(b), 0) /
            rawBlocks.length
          : 50;
      const rowThreshold = Math.max(20, avgBlockH * 0.5);

      // Sort blocks: top-to-bottom first; for blocks on the same "row" (within
      // rowThreshold of each other), sort left-to-right.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocks: any[] = [...rawBlocks].sort((a, b) => {
        const dy = boundingTopY(a) - boundingTopY(b);
        if (Math.abs(dy) > rowThreshold) return dy;
        return boundingLeftX(a) - boundingLeftX(b);
      });

      for (const block of blocks) {
        // Collect all words from every paragraph in this block.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allWords: any[] = (block.paragraphs ?? []).flatMap(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => p.words ?? []
        );

        // Compute a dynamic line-grouping threshold from the average word
        // height in this specific block.  This scales automatically with
        // image resolution — a phone photo at 4 K has word heights of
        // 60-150 px, while a small scan might be 15-30 px.  Using half the
        // average word height as the "same-line" band is robust across both.
        const avgWordH =
          allWords.length > 0
            ? allWords.reduce(
                (sum: number, w: { boundingBox?: { vertices?: { y?: number }[] } }) => {
                  const verts = w?.boundingBox?.vertices ?? [];
                  if (verts.length < 2) return sum;
                  const ys = verts.map((v) => v.y ?? 0);
                  return sum + (Math.max(...ys) - Math.min(...ys));
                },
                0
              ) / allWords.length
            : 20;
        const lineThreshold = Math.max(15, avgWordH * 0.5);

        // Sort words top-to-bottom, then left-to-right within the same line band.
        allWords.sort((a, b) => {
          const ay = boundingTopY(a);
          const by = boundingTopY(b);
          const dy = ay - by;
          if (Math.abs(dy) > lineThreshold) return dy;
          return boundingLeftX(a) - boundingLeftX(b);
        });

        // Reconstruct the block text, inserting spaces / newlines from
        // detectedBreak so cleanOcrText() can later reflow lines into sentences.
        let blockText = "";
        for (const word of allWords) {
          for (const symbol of word.symbols ?? []) {
            blockText += symbol.text;
            const breakType: string =
              symbol.property?.detectedBreak?.type ?? "";
            if (breakType === "SPACE" || breakType === "EOL_SURE_SPACE") {
              blockText += " ";
            } else if (breakType === "LINE_BREAK") {
              blockText += "\n";
            } else if (breakType === "HYPHEN") {
              blockText += "-\n";
            }
          }
        }

        const trimmed = blockText.trim();
        if (trimmed) blockTexts.push(trimmed);
      }
    }

    if (blockTexts.length > 0) return blockTexts.join("\n\n");
  }

  // Fallback: use the plain text field
  const text: string = response?.fullTextAnnotation?.text ?? "";
  return text;
}
