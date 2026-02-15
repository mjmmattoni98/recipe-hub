"use client";

import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilters } from "@/components/RecipeFilters";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import type { FilterCriteria, RecipeWithVideoSource } from "@/lib/recipe-types";
import {
  ChefHat,
  Filter,
  Plus,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type HomePageClientProps = {
  initialRecipes: RecipeWithVideoSource[];
  isLoggedIn: boolean;
};

const createInitialFilters = (): FilterCriteria => ({
  cuisine: [],
  difficulty: [],
  ingredients: [],
  searchQuery: "",
  maxCookTime: null,
  dietaryRestrictions: [],
  cookingStatus: "all",
});

function AuthenticatedActions({
  onSignOut,
}: Readonly<{ onSignOut: () => Promise<void> }>) {
  return (
    <>
      <Link href="/new-recipe">
        <Button size="sm" className="gap-2 rounded-full">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">New Recipe</span>
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground rounded-full"
        onClick={onSignOut}
      >
        Sign Out
      </Button>
    </>
  );
}

function GuestActions() {
  return (
    <Link href="/sign-in">
      <Button size="sm" variant="outline" className="rounded-full">
        Sign In
      </Button>
    </Link>
  );
}

export function HomePageClient({
  initialRecipes,
  isLoggedIn,
}: Readonly<HomePageClientProps>) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterCriteria>(createInitialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const availableCuisines = useMemo(
    () =>
      [...new Set(initialRecipes.map((recipe) => recipe.cuisine))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [initialRecipes],
  );

  const availableIngredients = useMemo(() => {
    const counts = new Map<string, number>();

    for (const recipe of initialRecipes) {
      for (const ingredient of recipe.ingredients) {
        counts.set(ingredient, (counts.get(ingredient) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([ingredient]) => ingredient);
  }, [initialRecipes]);

  const filteredRecipes = useMemo(() => {
    const searchQuery = filters.searchQuery.trim().toLowerCase();

    return initialRecipes.filter((recipe) => {
      if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery)) {
        return false;
      }

      if (
        filters.cuisine.length > 0 &&
        !filters.cuisine.includes(recipe.cuisine)
      ) {
        return false;
      }

      if (
        filters.difficulty.length > 0 &&
        !filters.difficulty.includes(recipe.difficulty)
      ) {
        return false;
      }

      if (filters.ingredients.length > 0) {
        const hasAllIngredients = filters.ingredients.every((ingredient) =>
          recipe.ingredients.some((recipeIngredient) =>
            recipeIngredient.toLowerCase().includes(ingredient.toLowerCase()),
          ),
        );

        if (!hasAllIngredients) {
          return false;
        }
      }

      if (
        filters.maxCookTime !== null &&
        recipe.cookTime > filters.maxCookTime
      ) {
        return false;
      }

      if (filters.dietaryRestrictions.length > 0) {
        const hasAllRestrictions = filters.dietaryRestrictions.every(
          (restriction) =>
            recipe.tags.some((tag) =>
              tag.toLowerCase().includes(restriction.toLowerCase()),
            ),
        );

        if (!hasAllRestrictions) {
          return false;
        }
      }

      if (filters.cookingStatus === "cooked" && !recipe.cooked) {
        return false;
      }

      if (filters.cookingStatus === "wantToTry" && recipe.cooked) {
        return false;
      }

      return true;
    });
  }, [filters, initialRecipes]);

  const activeFilterCount =
    filters.cuisine.length +
    filters.difficulty.length +
    filters.ingredients.length +
    (filters.maxCookTime !== null ? 1 : 0) +
    filters.dietaryRestrictions.length;

  const clearAllFilters = () => {
    setFilters(createInitialFilters());
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div className="bg-background min-h-screen">
      <nav className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl">
              <ChefHat
                className="text-primary-foreground h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-foreground text-xl font-bold tracking-tight">
              RecipeHub
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <AuthenticatedActions onSignOut={handleSignOut} />
            ) : (
              <GuestActions />
            )}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <div className="from-primary/6 via-secondary/50 to-background absolute inset-0 bg-linear-to-b" />
        <div className="from-primary/4 to-accent/3 absolute inset-0 bg-linear-to-r" />

        <div className="bg-primary/10 absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-accent/10 absolute -bottom-32 -left-32 h-80 w-80 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="font-body bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
                Your Recipe Collection
              </span>
            </div>

            <h1 className="font-display text-foreground animate-in fade-in slide-in-from-bottom-6 text-5xl leading-[1.1] font-bold tracking-tight text-balance delay-100 duration-700 md:text-7xl">
              Discover <span className="text-primary italic">Delicious</span>
              <br />
              Recipes
            </h1>

            <p className="font-body text-muted-foreground animate-in fade-in slide-in-from-bottom-6 mx-auto max-w-xl text-lg leading-relaxed delay-200 duration-700">
              Explore a curated collection of recipes from around the world.
              Filter by cuisine, difficulty, or ingredients to find your next
              culinary adventure.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-8 flex justify-center pt-4 delay-300 duration-700">
              <SearchBar
                value={filters.searchQuery}
                onChange={(value) =>
                  setFilters((current) => ({ ...current, searchQuery: value }))
                }
              />
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24">
              <div
                className="bg-card rounded-2xl border p-6"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-foreground flex items-center gap-2 text-lg font-semibold">
                    <SlidersHorizontal
                      className="text-primary h-4 w-4"
                      aria-hidden="true"
                    />
                    Filters
                  </h2>
                  {activeFilterCount > 0 ? (
                    <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </div>
                <RecipeFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  availableCuisines={availableCuisines}
                  availableIngredients={availableIngredients}
                />
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 lg:hidden">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-full">
                    <Filter className="h-4 w-4" aria-hidden="true" />
                    Filters
                    {activeFilterCount > 0 ? (
                      <span className="bg-primary text-primary-foreground ml-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-card w-80">
                  <SheetHeader>
                    <SheetTitle className="font-display">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <RecipeFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      availableCuisines={availableCuisines}
                      availableIngredients={availableIngredients}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="mb-8 flex items-center justify-between gap-4">
              <p className="font-body text-muted-foreground text-sm">
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {filteredRecipes.length}
                </span>{" "}
                {filteredRecipes.length === 1 ? "recipe" : "recipes"}
              </p>

              {activeFilterCount > 0 ? (
                <div className="hidden items-center gap-2 md:flex">
                  {filters.cuisine.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {cuisine}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((current) => ({
                            ...current,
                            cuisine: current.cuisine.filter(
                              (item) => item !== cuisine,
                            ),
                          }))
                        }
                        aria-label={`Remove ${cuisine} filter`}
                        className="hover:bg-primary/20 -mr-1 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}

                  {filters.difficulty.map((difficulty) => (
                    <span
                      key={difficulty}
                      className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {difficulty}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((current) => ({
                            ...current,
                            difficulty: current.difficulty.filter(
                              (item) => item !== difficulty,
                            ),
                          }))
                        }
                        aria-label={`Remove ${difficulty} filter`}
                        className="hover:bg-accent/80 -mr-1 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}

                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground ml-1 text-xs underline underline-offset-2 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>

            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="bg-muted mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
                  <UtensilsCrossed
                    className="text-muted-foreground h-10 w-10"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-display text-foreground mb-2 text-2xl font-semibold">
                  No recipes found
                </h3>
                <p className="text-muted-foreground font-body mx-auto mb-6 max-w-sm text-sm leading-relaxed">
                  Try adjusting your filters or search terms to discover
                  something delicious.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-border/60 mt-12 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                <ChefHat className="text-primary h-4 w-4" aria-hidden="true" />
              </div>
              <span className="font-display text-muted-foreground text-sm font-semibold">
                RecipeHub
              </span>
            </div>
            <p className="font-body text-muted-foreground text-xs">
              Made with love for food lovers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
