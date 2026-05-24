"use client";
/**
 * OCR abstraction layer.
 *
 * Strategy:
 *  1. Preprocess image (grayscale + contrast boost) for better accuracy
 *  2. POST to /api/ocr → server calls Google Cloud Vision (if key is set)
 *  3. If GCV fails or is unconfigured → fall back to Tesseract.js
 *  4. Post-process result to remove margin artifacts and tidy whitespace
 *  5. AI cleanup pass via /api/ocr/cleanup (Claude Haiku) to fix OCR
 *     character errors, split/joined words, and reorder scrambled lines.
 *     Silently skipped if ANTHROPIC_API_KEY is not configured.
 */
import { extractWithTesseract } from "./tesseract";

export async function extractText(imageBase64: string): Promise<string> {
  const processed = await preprocessImage(imageBase64);

  let raw = "";

  try {
    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: processed }),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.text === "string" && data.text.trim()) {
        raw = data.text;
      }
    }
  } catch {
    // Network error or GCV not configured — fall through to Tesseract
  }

  if (!raw) {
    raw = await extractWithTesseract(processed);
  }

  // Basic structural cleanup first (remove artefact lines, reflow paragraphs)
  const cleaned = cleanOcrText(raw);

  // AI spell-correction pass: fixes OCR misreads, split/joined words, and
  // re-orders interleaved lines. Silently skipped if the API key is absent.
  return aiCleanup(cleaned);
}

/**
 * Sends the cleaned OCR text to the /api/ocr/cleanup route (Claude Haiku)
 * which corrects character-level OCR errors and reorders scrambled lines.
 * Falls back to the input string on any error or if the endpoint is unavailable.
 */
async function aiCleanup(text: string): Promise<string> {
  if (!text.trim()) return text;
  try {
    const res = await fetch("/api/ocr/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.text === "string" && data.text.trim()) {
        return data.text;
      }
    }
  } catch {
    // Cleanup is optional — return the pre-cleaned text if anything fails
  }
  return text;
}

/**
 * Preprocesses the image using Canvas API:
 *  - Converts to greyscale (removes colour noise)
 *  - Boosts contrast so ink stands out from paper
 * Returns a new base64 string (JPEG, quality 92).
 */
async function preprocessImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64); // canvas unavailable — return original
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Apply greyscale + contrast boost via pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const contrast = 1.4; // 1.0 = no change, higher = more contrast
      const intercept = 128 * (1 - contrast);

      for (let i = 0; i < d.length; i += 4) {
        // Luminance-weighted greyscale (perceptual)
        const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Contrast stretch around mid-grey
        const val = Math.min(255, Math.max(0, contrast * grey + intercept));
        d[i] = d[i + 1] = d[i + 2] = val;
        // alpha unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      // Export as JPEG; strip the data-URL prefix
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => resolve(base64); // on error return original
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Post-processing to tidy OCR output:
 *  - Removes lines that are ≤2 characters (margin bleed artefacts like "1", "k")
 *  - Reflows lines within each paragraph into a single sentence (removes
 *    mid-sentence line breaks that OCR produces from handwritten line wraps)
 *  - Preserves paragraph breaks (blank lines between distinct sections)
 *  - Trims leading/trailing whitespace
 */
function cleanOcrText(raw: string): string {
  // 1. Remove short artefact lines
  const filtered = raw
    .split("\n")
    .filter((line) => line.trim().length > 2)
    .join("\n");

  // 2. Split into paragraphs on blank lines, then join wrapped lines within
  //    each paragraph into a single flowing sentence
  const paragraphs = filtered.split(/\n{2,}/);

  const reflowed = paragraphs
    .map((para) =>
      para
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);

  return reflowed.join("\n\n").trim();
}

/** Convert a File to base64 string (without data: prefix) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
