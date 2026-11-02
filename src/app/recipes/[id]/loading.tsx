import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the recipe page layout so nothing jumps when it arrives
export default function RecipeLoading() {
  return (
    <main id="main-content" aria-busy="true">
      <div className="page flex min-h-9 items-center pt-6 md:pt-8">
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="page mt-6 grid gap-8 md:mt-8 lg:grid-cols-12 lg:items-end lg:gap-12">
        <div className="lg:col-span-7">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-14 w-full md:h-20" />
          <Skeleton className="mt-3 h-14 w-2/3 md:h-20" />
          <Skeleton className="mt-7 h-5 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-5 w-3/4 max-w-2xl" />
          <div className="mt-10 grid grid-cols-2 gap-y-5 border-y py-5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-9 w-14" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="-order-1 aspect-4/3 w-full rounded-md lg:order-none lg:col-span-5 lg:aspect-4/5" />
      </div>

      <div className="page mt-16 grid gap-12 md:mt-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="rounded-lg border p-6 md:p-7">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="mt-5 h-10 w-full" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="mt-4 h-4"
                style={{ width: `${65 + (i % 4) * 8}%` }}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-8 lg:pl-6">
          <Skeleton className="h-11 w-56" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b py-7">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
