"use client";
import { useRef } from "react";
import Image from "next/image";
import { Camera, ImagePlus, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface CameraStepProps {
  title: string;
  subtitle?: string;
  preview: string | null;
  onCapture: (file: File) => void;
  onClear: () => void;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  nextLabel?: string;
}

export default function CameraStep({
  title,
  subtitle,
  preview,
  onCapture,
  onClear,
  onNext,
  onSkip,
  skipLabel = "Skip",
  nextLabel = "Next",
}: CameraStepProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-nc-charcoal">{title}</h2>
        {subtitle && (
          <p className="text-sm text-nc-charcoal/60 mt-1">{subtitle}</p>
        )}
      </div>

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-nc-grey">
          <Image
            src={preview}
            alt="Card photo"
            width={600}
            height={400}
            className="w-full h-auto"
            unoptimized
          />
          <button
            onClick={onClear}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-nc-charcoal" />
          </button>
        </div>
      ) : (
        /* Empty capture area with card outline guide */
        <div className="relative bg-nc-charcoal/5 rounded-2xl border-2 border-dashed border-nc-grey flex flex-col items-center justify-center py-16 gap-3 overflow-hidden">
          {/* Card guide overlay — pointer-events-none so it never blocks button clicks */}
          <svg
            viewBox="0 0 320 200"
            className="absolute inset-4 w-[calc(100%-2rem)] opacity-20 text-nc-green pointer-events-none"
            fill="none"
          >
            <rect
              x="4"
              y="4"
              width="312"
              height="192"
              rx="8"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="10 5"
            />
            {/* Corner marks */}
            <path d="M4 34 L4 4 L34 4" stroke="currentColor" strokeWidth="3" />
            <path d="M286 4 L316 4 L316 34" stroke="currentColor" strokeWidth="3" />
            <path d="M316 166 L316 196 L286 196" stroke="currentColor" strokeWidth="3" />
            <path d="M34 196 L4 196 L4 166" stroke="currentColor" strokeWidth="3" />
          </svg>

          <Camera className="w-10 h-10 text-nc-charcoal/30" />
          <p className="text-sm text-nc-charcoal/50 text-center">
            Position your notecard within the guide
          </p>
        </div>
      )}

      {/* Camera / gallery inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex flex-col gap-3">
        {!preview && (
          <>
            <Button
              fullWidth
              size="lg"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="w-5 h-5" />
              Open camera
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => galleryRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4" />
              Choose from photos
            </Button>
          </>
        )}

        {preview && (
          <>
            <Button fullWidth size="lg" onClick={onNext}>
              {nextLabel}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
              Retake
            </Button>
          </>
        )}

        {onSkip && !preview && (
          <Button fullWidth variant="ghost" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
