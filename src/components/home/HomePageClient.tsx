"use client";

import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilters } from "@/components/RecipeFilters";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadMoreOnScroll } from "@/hooks/use-load-more-on-scroll";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APPLIANCE_LABELS } from "@/lib/recipe-appliances";
import {
  COOKING_STATUS_OPTIONS,
  countActiveFilters,
  DIETARY_OPTIONS,
  EMPTY_FILTERS,
  parseRecipeFilters,
  RECIPE_PAGE_SIZE,
  recipeFiltersToSearchParams,
  recipeListInput,
  totalTimeLabel,
} from "@/lib/recipe-filters";
import { DIFFICULTY_LABELS, type FilterCriteria } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { keepPreviousData } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type HomePageClientProps = {
  isLoggedIn: boolean;
  userName: string | null;
};

const SEARCH_DEBOUNCE_MS = 400;
// Matches the xl:grid-cols-4 grid: the first row is above the fold
const EAGER_IMAGE_COUNT = 4;

// Filters live in the URL so they survive opening a recipe and coming back,
// and so a filtered view can be shared. replaceState (rather than
// router.replace) keeps useSearchParams in sync without a server round trip,
// and keeps filter tweaks out of the back-button history.
function useUrlRecipeFilters(isLoggedIn: boolean) {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseRecipeFilters(searchParams, isLoggedIn),
    [searchParams, isLoggedIn],
  );

  const setFilters = useCallback((next: FilterCriteria) => {
    const query = recipeFiltersToSearchParams(next).toString();
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }, []);

  return [filters, setFilters] as const;
}

function ActiveFilterPills({
  filters,
  onFilterChange,
}: Readonly<{
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
}>) {
  const without = <T,>(values: T[], value: T) =>
    values.filter((item) => item !== value);

  const pills: { key: string; label: string; next: FilterCriteria }[] = [];

  if (filters.appliance !== null) {
    pills.push({
      key: "appliance",
      label: APPLIANCE_LABELS[filters.appliance],
      next: { ...filters, appliance: null },
    });
  }

  if (filters.cookingStatus !== "all") {
    pills.push({
      key: "status",
      label:
        COOKING_STATUS_OPTIONS.find(
          (option) => option.value === filters.cookingStatus,
        )?.label ?? filters.cookingStatus,
      next: { ...filters, cookingStatus: "all" },
    });
  }
  for (const difficulty of filters.difficulty) {
    pills.push({
      key: `difficulty-${difficulty}`,
      label: DIFFICULTY_LABELS[difficulty],
      next: { ...filters, difficulty: without(filters.difficulty, difficulty) },
    });
  }
  for (const cuisine of filters.cuisine) {
    pills.push({
      key: `cuisine-${cuisine}`,
      label: cuisine,
      next: { ...filters, cuisine: without(filters.cuisine, cuisine) },
    });
  }
  if (filters.maxTotalTime !== null) {
    pills.push({
      key: "time",
      label: totalTimeLabel(filters.maxTotalTime),
      next: { ...filters, maxTotalTime: null },
    });
  }
  for (const diet of filters.dietaryRestrictions) {
    pills.push({
      key: `diet-${diet}`,
      label:
        DIETARY_OPTIONS.find((option) => option.value === diet)?.label ?? diet,
      next: {
        ...filters,
        dietaryRestrictions: without(filters.dietaryRestrictions, diet),
      },
    });
  }

  if (pills.length === 0) return null;

  return (
    <ul
      className="flex flex-wrap items-center gap-2"
      aria-label="Filtros activos"
    >
      {pills.map((pill) => (
        <li
          key={pill.key}
          className="bg-accent text-accent-foreground inline-flex h-8 items-center gap-1 rounded-full pr-1 pl-3 text-sm first-letter:uppercase"
        >
          {pill.label}
          <button
            type="button"
            onClick={() => onFilterChange(pill.next)}
            aria-label={`Quitar filtro ${pill.label}`}
            className="hover:bg-foreground/10 flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              ...EMPTY_FILTERS,
              searchQuery: filters.searchQuery,
            })
          }
          className="text-muted-foreground hover:text-foreground ml-1 cursor-pointer text-sm underline decoration-1 underline-offset-4 transition-colors"
        >
          Quitar todos
        </button>
      </li>
    </ul>
  );
}

function ResultCount({
  shown,
  total,
}: Readonly<{ shown: number; total: number | undefined }>) {
  if (total === undefined) return null;

  if (shown < total) {
    return (
      <>
        <span className="text-foreground">{shown}</span> de{" "}
        <span className="text-foreground">{total}</span> recetas
      </>
    );
  }

  return (
    <>
      <span className="text-foreground">{total}</span>{" "}
      {total === 1 ? "receta" : "recetas"}
    </>
  );
}

const RECIPE_GRID_CLASS =
  "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
// One row on the widest grid: enough to show more is coming without
// pushing the real cards around when they land.
const NEXT_PAGE_SKELETON_COUNT = 4;

function RecipeCardSkeletons({ count }: Readonly<{ count: number }>) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={`recipe-skeleton-${i}`} aria-hidden="true">
      <Skeleton className="aspect-4/3 w-full rounded-md" />
      <Skeleton className="mt-4 h-3 w-1/2" />
      <Skeleton className="mt-3 h-7 w-4/5" />
      <Skeleton className="mt-3 h-4 w-full" />
    </div>
  ));
}

function RecipeGridSkeleton() {
  return (
    <div className={RECIPE_GRID_CLASS}>
      <RecipeCardSkeletons count={RECIPE_PAGE_SIZE} />
    </div>
  );
}

export function HomePageClient({
  isLoggedIn,
  userName,
}: Readonly<HomePageClientProps>) {
  const [filters, setFilters] = useUrlRecipeFilters(isLoggedIn);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // The input updates on every keystroke; the URL (and so the query) only
  // follows once typing pauses.
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  useEffect(() => {
    const searchQuery = searchInput.trim();
    if (searchQuery === filters.searchQuery) return;

    const handle = setTimeout(() => {
      setFilters({ ...filters, searchQuery });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [searchInput, filters, setFilters]);

  const queryInput = useMemo(() => recipeListInput(filters), [filters]);

  const {
    data,
    isLoading,
    isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = api.recipe.getAll.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Keep showing the previous results while a new filter loads instead
    // of swapping the whole grid for skeletons.
    placeholderData: keepPreviousData,
  });

  const { data: facets } = api.recipe.getFilterFacets.useQuery();
  const availableCuisines = facets?.cuisines ?? [];

  const recipes = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total;

  // A failed page stops the automatic loading; the retry button takes over
  // so a flaky connection can't loop requests. Placeholder data is the
  // previous filter's list, so it must not page in more of it.
  const setLoadMoreSentinel = useLoadMoreOnScroll({
    enabled:
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError &&
      !isPlaceholderData,
    onLoadMore: () => void fetchNextPage(),
  });

  const activeFilterCount = countActiveFilters(filters);
  const firstName = userName?.split(/\s+/)[0];

  const clearEverything = () => {
    setSearchInput("");
    setFilters(EMPTY_FILTERS);
  };

  return (
    <main id="main-content">
      <header className="page pt-10 pb-8 md:pt-16 md:pb-12">
        <p className="eyebrow text-muted-foreground mb-4">
          {firstName ? `Hola, ${firstName}` : "Recetario de casa"}
        </p>
        {isLoggedIn ? (
          <h1 className="font-display text-foreground text-[3.25rem] leading-[0.92] tracking-tight text-balance md:text-8xl">
            ¿Qué cocinamos <em className="text-primary">hoy</em>?
          </h1>
        ) : (
          <>
            <h1 className="font-display text-foreground max-w-4xl text-[3.25rem] leading-[0.92] tracking-tight text-balance md:text-8xl">
              Las recetas de casa, <em className="text-primary">a mano</em>.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
              Un recetario compartido: busca por ingrediente, tiempo o aparato y
              encuentra qué preparar esta noche.
            </p>
          </>
        )}

        <div className="mt-8 flex max-w-3xl gap-2 md:mt-10">
          <SearchBar value={searchInput} onChange={setSearchInput} />

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="bg-card h-12 shrink-0 gap-2 px-4"
                aria-label={
                  activeFilterCount > 0
                    ? `Filtros (${activeFilterCount} activos)`
                    : "Filtros"
                }
              >
                <SlidersHorizontal aria-hidden="true" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilterCount > 0 ? (
                  <span className="bg-foreground text-background flex size-5 items-center justify-center rounded-full font-mono text-[11px]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-background w-full gap-0 sm:max-w-md"
            >
              <SheetHeader className="border-b px-6 pt-6 pb-5">
                <SheetTitle className="font-display text-4xl leading-none font-normal tracking-tight">
                  Filtros
                </SheetTitle>
                <SheetDescription>
                  Los cambios se aplican al momento.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                <RecipeFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  availableCuisines={availableCuisines}
                  isLoggedIn={isLoggedIn}
                />
              </div>
              <SheetFooter className="flex-row items-center justify-between border-t px-6 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={activeFilterCount === 0}
                  onClick={() =>
                    setFilters({
                      ...EMPTY_FILTERS,
                      searchQuery: filters.searchQuery,
                    })
                  }
                >
                  Borrar
                </Button>
                <SheetClose asChild>
                  <Button type="button">
                    {total === undefined
                      ? "Ver recetas"
                      : `Ver ${total} ${total === 1 ? "receta" : "recetas"}`}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section aria-labelledby="results-heading" className="page">
        <div className="mb-8 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <h2
            id="results-heading"
            className="eyebrow text-muted-foreground shrink-0"
            aria-live="polite"
          >
            <ResultCount shown={recipes.length} total={total} />
          </h2>
          <ActiveFilterPills filters={filters} onFilterChange={setFilters} />
        </div>

        {isLoading ? (
          <RecipeGridSkeleton />
        ) : recipes.length > 0 ? (
          <>
            <div
              className={cn(
                RECIPE_GRID_CLASS,
                "transition-opacity duration-200",
                isPlaceholderData && "opacity-50",
              )}
              aria-busy={isPlaceholderData || isFetchingNextPage}
            >
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isLoggedIn={isLoggedIn}
                  eager={index < EAGER_IMAGE_COUNT}
                />
              ))}
              {isFetchingNextPage ? (
                <RecipeCardSkeletons count={NEXT_PAGE_SKELETON_COUNT} />
              ) : null}
            </div>

            {hasNextPage ? (
              <div
                ref={setLoadMoreSentinel}
                className="mt-16 flex justify-center"
              >
                {isFetchNextPageError ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-muted-foreground text-sm">
                      No se pudieron cargar más recetas.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void fetchNextPage()}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : recipes.length > RECIPE_PAGE_SIZE ? (
              <p className="eyebrow text-muted-foreground mt-16 text-center">
                Eso es todo · {recipes.length} recetas
              </p>
            ) : null}
          </>
        ) : (
          <div className="mx-auto max-w-md py-20 text-center">
            <p className="font-display text-foreground text-5xl tracking-tight">
              Nada por aquí.
            </p>
            <p className="text-muted-foreground mt-4 text-pretty">
              Ninguna receta coincide con la búsqueda y los filtros. Prueba con
              menos filtros o con otra palabra.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={clearEverything}>
                Borrar búsqueda y filtros
              </Button>
              {isLoggedIn ? (
                <Button asChild>
                  <Link href="/new-recipe">Añadir una receta</Link>
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
