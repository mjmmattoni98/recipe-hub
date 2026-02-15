export default function RecipeLoading() {
  return (
    <main id="main-content" className="bg-background min-h-screen pb-16">
      <div className="relative aspect-video max-h-[55vh] w-full overflow-hidden">
        <div className="bg-muted h-full w-full animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto -mt-24 max-w-4xl px-4">
        <div
          className="bg-card rounded-2xl border p-7 md:p-10"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="mb-4 flex gap-2">
            <div className="bg-muted h-7 w-20 animate-pulse rounded-full" />
            <div className="bg-muted h-7 w-16 animate-pulse rounded-full" />
          </div>

          <div className="bg-muted mb-4 h-11 w-3/4 animate-pulse rounded-xl" />

          <div className="space-y-2">
            <div className="bg-muted h-5 w-full animate-pulse rounded-lg" />
            <div className="bg-muted h-5 w-2/3 animate-pulse rounded-lg" />
          </div>

          <div className="border-border mt-8 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-muted h-10 w-10 animate-pulse rounded-xl" />
                <div className="space-y-1.5">
                  <div className="bg-muted h-3 w-14 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div className="space-y-3">
              <div className="bg-muted mb-5 h-8 w-32 animate-pulse rounded-lg" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="bg-muted h-6 w-6 shrink-0 animate-pulse rounded-full" />
                  <div
                    className="bg-muted h-5 animate-pulse rounded-lg"
                    style={{ width: `${70 + (i % 5) * 5}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-5">
              <div className="bg-muted mb-5 h-8 w-32 animate-pulse rounded-lg" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="bg-muted h-8 w-8 shrink-0 animate-pulse rounded-full" />
                  <div className="bg-muted h-16 w-full animate-pulse rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-border mt-10 border-t pt-6">
            <div className="bg-muted mb-3 h-3 w-10 animate-pulse rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted h-7 w-18 animate-pulse rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
