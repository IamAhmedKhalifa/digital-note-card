"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[size];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-nc-charcoal/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className={`
          relative w-full ${sizeClass} bg-nc-warm rounded-t-2xl sm:rounded-2xl
          shadow-2xl max-h-[90vh] overflow-y-auto
          animate-in slide-in-from-bottom-4 duration-200
        `}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-nc-grey rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-nc-grey">
            <h2 className="text-base font-semibold text-nc-charcoal">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-nc-surface transition-colors"
            >
              <X className="w-5 h-5 text-nc-charcoal/60" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-nc-surface transition-colors z-10"
          >
            <X className="w-5 h-5 text-nc-charcoal/60" />
          </button>
        )}

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
