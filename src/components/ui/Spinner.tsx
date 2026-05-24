interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-3",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      className={`
        inline-block rounded-full animate-spin
        border-nc-green/30 border-t-nc-green
        ${sizes[size]}
        ${className}
      `}
    />
  );
}

interface SpinnerOverlayProps {
  message?: string;
}

export function SpinnerOverlay({ message }: SpinnerOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-nc-charcoal/60 text-center">{message}</p>
      )}
    </div>
  );
}
