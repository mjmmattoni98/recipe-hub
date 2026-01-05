export default function RecipeLoading() {
  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Header Image Skeleton */}
      <div className="relative aspect-video max-h-[60vh] w-full">
        <div className="bg-muted h-full w-full animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto -mt-20 max-w-4xl px-4">
        <div className="bg-card border-border rounded-xl border p-6 shadow-lg md:p-8">
          {/* Header Content Skeleton */}
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
          </div>

          <div className="bg-muted mb-4 h-10 w-3/4 animate-pulse rounded-lg" />
          <div className="bg-muted h-6 w-full animate-pulse rounded-lg" />
          <div className="bg-muted mt-2 h-6 w-2/3 animate-pulse rounded-lg" />

          {/* Meta Info Skeleton */}
          <div className="border-border mt-6 flex flex-wrap gap-6 border-y py-6">
            <div className="bg-muted h-12 w-28 animate-pulse rounded-lg" />
            <div className="bg-muted h-12 w-28 animate-pulse rounded-lg" />
          </div>

          {/* Content Grid Skeleton */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="bg-muted h-8 w-32 animate-pulse rounded-lg" />
              <div className="bg-muted h-6 w-[85%] animate-pulse rounded-lg" />
              <div className="bg-muted h-6 w-[92%] animate-pulse rounded-lg" />
              <div className="bg-muted h-6 w-[78%] animate-pulse rounded-lg" />
              <div className="bg-muted h-6 w-[95%] animate-pulse rounded-lg" />
              <div className="bg-muted h-6 w-[82%] animate-pulse rounded-lg" />
              <div className="bg-muted h-6 w-[88%] animate-pulse rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="bg-muted h-8 w-32 animate-pulse rounded-lg" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="bg-muted h-8 w-8 shrink-0 animate-pulse rounded-full" />
                  <div className="bg-muted h-16 w-full animate-pulse rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Tags Skeleton */}
          <div className="border-border mt-8 border-t pt-6">
            <div className="bg-muted mb-3 h-4 w-12 animate-pulse rounded" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted h-6 w-16 animate-pulse rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
