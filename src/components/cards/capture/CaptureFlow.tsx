"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { extractText, fileToBase64 } from "@/lib/ocr/index";
import CameraStep from "./CameraStep";
import CardTypeStep from "./CardTypeStep";
import OcrReviewStep, { type SaveMode } from "./OcrReviewStep";
import { SpinnerOverlay } from "@/components/ui/Spinner";
import {
  detectCardType,
  getDefaultContent,
  parseOcrIntoContent,
  type CardContent,
  type CardType,
} from "@/types/cards";

type Step = "front" | "back" | "type" | "review";

interface CaptureFlowProps {
  bookId: string;
  userId: string;
}

export default function CaptureFlow({ bookId }: CaptureFlowProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("front");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [frontOcrText, setFrontOcrText] = useState("");
  const [backOcrText, setBackOcrText] = useState("");

  // Card type — auto-detected from OCR header text, user-selectable
  const [cardType, setCardType] = useState<CardType>("general");
  const [autoDetected, setAutoDetected] = useState<CardType | null>(null);

  // Content kept in sync by OcrReviewStep — initialised when card type is chosen
  const [content, setContent] = useState<CardContent>({ notes: "" });
  const [ocrFailed, setOcrFailed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Step: Front photo ───────────────────────────────────────────────────
  function handleFrontCapture(file: File) {
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
  }

  // ── Step: Back photo ────────────────────────────────────────────────────
  function handleBackCapture(file: File) {
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
  }

  // ── OCR both sides, auto-detect type, then go to type-selection ─────────
  const proceedToTypeSelection = useCallback(async () => {
    setProcessing(true);
    try {
      let fText = "";
      let bText = "";

      if (frontFile) {
        const b64 = await fileToBase64(frontFile);
        fText = await extractText(b64);
      }
      if (backFile) {
        const b64 = await fileToBase64(backFile);
        bText = await extractText(b64);
      }

      setFrontOcrText(fText);
      setBackOcrText(bText);

      const combined = [fText, bText].filter((t) => t.trim()).join("\n\n");
      const detected = combined ? detectCardType(combined) : null;
      setAutoDetected(detected);
      setCardType(detected ?? "general");
      setOcrFailed(!combined);
    } catch {
      setOcrFailed(true);
      setFrontOcrText("");
      setBackOcrText("");
    } finally {
      setProcessing(false);
      setStep("type");
    }
  }, [frontFile, backFile]);

  // ── When card type confirmed, seed structured content and move to review ─
  function handleTypeConfirmed() {
    const combined = [frontOcrText, backOcrText]
      .filter((t) => t.trim())
      .join("\n\n");
    setContent(
      combined ? parseOcrIntoContent(combined, cardType) : getDefaultContent(cardType)
    );
    setStep("review");
  }

  // When user changes type on the type step, reset content seed for the new type
  function handleTypeChange(t: CardType) {
    setCardType(t);
  }

  // ── Post a single card to the API ───────────────────────────────────────
  async function postCard(opts: {
    cardContent: CardContent;
    rawOcr: string;
    imageFile: File | null;
    backImageFile?: File | null;
    type: CardType;
  }) {
    const fd = new FormData();
    fd.append("bookId", bookId);
    fd.append("cardType", opts.type);
    fd.append("content", JSON.stringify(opts.cardContent));
    if (opts.rawOcr) fd.append("rawOcrText", opts.rawOcr);
    if (opts.imageFile) fd.append("front", opts.imageFile);
    if (opts.backImageFile) fd.append("back", opts.backImageFile);

    const res = await fetch("/api/cards", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
  }

  // ── Save — called by OcrReviewStep with final edited content ────────────
  async function handleSave(
    mode: SaveMode,
    finalContent: CardContent,
    frontText: string,
    backText: string
  ) {
    setSaving(true);
    try {
      // "Save as two notes" only makes sense for free-form types where each side
      // is independent prose. For structured types, the front/back are facets of
      // a single card, so we always save as one.
      const isStructured =
        cardType !== "general" && cardType !== "reading_notes";

      if (mode === "single" || isStructured) {
        const combinedRaw = [frontText, backText]
          .filter((t) => t.trim())
          .join("\n\n");
        await postCard({
          cardContent: finalContent,
          rawOcr: combinedRaw,
          imageFile: frontFile,
          backImageFile: backFile,
          type: cardType,
        });
      } else {
        // Free-form types only — save two separate cards
        if (frontText.trim() || frontFile) {
          await postCard({
            cardContent: { notes: frontText },
            rawOcr: frontText,
            imageFile: frontFile,
            type: cardType,
          });
        }
        if (backText.trim() || backFile) {
          await postCard({
            cardContent: { notes: backText },
            rawOcr: backText,
            imageFile: backFile,
            type: cardType,
          });
        }
      }

      router.push(`/books/${bookId}`);
      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Something went wrong saving the note. Please try again.");
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (processing) {
    return <SpinnerOverlay message="Reading your handwriting..." />;
  }

  switch (step) {
    case "front":
      return (
        <CameraStep
          title="Photograph your notes"
          subtitle="Place your notes flat in good light."
          preview={frontPreview}
          onCapture={handleFrontCapture}
          onClear={() => {
            setFrontFile(null);
            setFrontPreview(null);
          }}
          onNext={() => setStep("back")}
          nextLabel="Next — photograph the back"
        />
      );

    case "back":
      return (
        <CameraStep
          title="Photograph the back"
          subtitle="Optional — skip if you only have one side."
          preview={backPreview}
          onCapture={handleBackCapture}
          onClear={() => {
            setBackFile(null);
            setBackPreview(null);
          }}
          onNext={proceedToTypeSelection}
          onSkip={proceedToTypeSelection}
          skipLabel="Skip — one side only"
          nextLabel="Scan your notes"
        />
      );

    case "type":
      return (
        <CardTypeStep
          selected={cardType}
          autoDetected={autoDetected}
          onSelect={handleTypeChange}
          onNext={handleTypeConfirmed}
          onBack={() => setStep("back")}
        />
      );

    case "review":
      return (
        <OcrReviewStep
          cardType={cardType}
          content={content}
          frontPreview={frontPreview}
          backPreview={backPreview}
          frontOcrText={frontOcrText}
          backOcrText={backOcrText}
          ocrFailed={ocrFailed}
          onContentChange={setContent}
          onSave={handleSave}
          onBack={() => setStep("type")}
          saving={saving}
        />
      );
  }
}
