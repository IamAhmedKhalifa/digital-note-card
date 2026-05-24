/** Shimmer placeholder shown while data loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-nc-grey/60 rounded-xl ${className}`}
    />
  );
}

/** Full-page skeleton for the library grid */
export function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton row for a card list item */
export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-nc-surface rounded-2xl border border-nc-grey mx-4 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 ${
            i < rows - 1 ? "border-b border-nc-grey" : ""
          }`}
        >
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
