"use client";
import { useState } from "react";
import { FileText, FileDown, Sheet } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Book, Card } from "@/types/database";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  book: Book;
  cards: Card[];
}

export default function ExportModal({
  open,
  onClose,
  book,
  cards,
}: ExportModalProps) {
  const [loading, setLoading] = useState<"pdf" | "markdown" | "csv" | null>(null);

  const hasVocab = cards.some((c) => c.card_type === "vocabulary_tracker");

  async function handlePdf() {
    setLoading("pdf");
    try {
      const { exportBookAsPdf } = await import("@/lib/export/pdf");
      await exportBookAsPdf(book, cards);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkdown() {
    setLoading("markdown");
    try {
      const { exportBookAsMarkdown } = await import("@/lib/export/markdown");
      exportBookAsMarkdown(book, cards);
    } finally {
      setLoading(null);
    }
  }

  async function handleCsv() {
    setLoading("csv");
    try {
      const { exportVocabularyAsCsv } = await import("@/lib/export/csv");
      exportVocabularyAsCsv(book, cards);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Export">
      <p className="text-sm text-nc-charcoal/60 mb-5">
        Export all {cards.length} card{cards.length !== 1 ? "s" : ""} from{" "}
        <strong className="text-nc-charcoal">{book.title}</strong>.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={handlePdf}
          disabled={!!loading}
          className="flex items-center gap-4 p-4 rounded-xl border border-nc-grey hover:border-nc-green/40 hover:bg-nc-green/5 transition-all text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-nc-green/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-nc-green" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-nc-charcoal">PDF</p>
            <p className="text-xs text-nc-charcoal/50">
              Clean, branded document with all card content
            </p>
          </div>
          {loading === "pdf" && (
            <span className="w-4 h-4 border-2 border-nc-green/30 border-t-nc-green rounded-full animate-spin" />
          )}
        </button>

        <button
          onClick={handleMarkdown}
          disabled={!!loading}
          className="flex items-center gap-4 p-4 rounded-xl border border-nc-grey hover:border-nc-green/40 hover:bg-nc-green/5 transition-all text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-nc-green/10 flex items-center justify-center shrink-0">
            <FileDown className="w-5 h-5 text-nc-green" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-nc-charcoal">Markdown</p>
            <p className="text-xs text-nc-charcoal/50">
              .md file with all notes, structured by type
            </p>
          </div>
          {loading === "markdown" && (
            <span className="w-4 h-4 border-2 border-nc-green/30 border-t-nc-green rounded-full animate-spin" />
          )}
        </button>

        {hasVocab && (
          <button
            onClick={handleCsv}
            disabled={!!loading}
            className="flex items-center gap-4 p-4 rounded-xl border border-nc-grey hover:border-nc-green/40 hover:bg-nc-green/5 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-nc-gold/10 flex items-center justify-center shrink-0">
              <Sheet className="w-5 h-5 text-nc-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-nc-charcoal">
                Vocabulary CSV
              </p>
              <p className="text-xs text-nc-charcoal/50">
                Word + definition spreadsheet
              </p>
            </div>
            {loading === "csv" && (
              <span className="w-4 h-4 border-2 border-nc-gold/30 border-t-nc-gold rounded-full animate-spin" />
            )}
          </button>
        )}
      </div>

      <Button variant="ghost" fullWidth className="mt-4" onClick={onClose}>
        Cancel
      </Button>
    </Modal>
  );
}
