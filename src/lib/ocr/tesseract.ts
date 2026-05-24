"use client";
/**
 * Tesseract.js — client-side fallback OCR.
 * Dynamic import ensures the WebAssembly module is never loaded server-side.
 *
 * Configuration notes:
 *  - OEM 1  = LSTM neural net engine (best accuracy for cursive/handwriting)
 *  - PSM 6  = Assume a single uniform block of text (good for note cards)
 */
export async function extractWithTesseract(imageBase64: string): Promise<string> {
  const { createWorker, OEM, PSM } = await import("tesseract.js");

  const worker = await createWorker("eng", OEM.LSTM_ONLY);
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
    const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    return text;
  } finally {
    await worker.terminate();
  }
}
