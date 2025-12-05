"use client";

import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilters } from "@/components/RecipeFilters";
import { RecipeModal } from "@/components/RecipeModal";
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
import type { FilterCriteria, RecipeWithVideoSource } from "@/lib/recipe-types";
import { api } from "@/trpc/react";
import { Filter, UtensilsCrossed, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function Home() {
  const [filters, setFilters] = useState<FilterCriteria>({
    cuisine: [],
    difficulty: [],
    ingredients: [],
    searchQuery: "",
    maxCookTime: null,
    dietaryRestrictions: [],
    cookingStatus: "all",
  });
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithVideoSource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch recipes from the database
  const { data: recipes = [] as RecipeWithVideoSource[] } =
    api.recipe.getAll.useQuery();

  // Extract unique values for filters
  const availableCuisines = useMemo(
    () =>
      [...new Set(recipes.map((r) => r.cuisine))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [recipes],
  );

  const availableIngredients = useMemo(() => {
    const allIngredients = recipes.flatMap((r) => r.ingredients);
    const counts = allIngredients.reduce(
      (acc, ing) => {
        acc[ing] = (acc[ing] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([ing]) => ing);
  }, [recipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search query filter
      if (
        filters.searchQuery &&
        !recipe.title.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Cuisine filter
      if (
        filters.cuisine.length > 0 &&
        !filters.cuisine.includes(recipe.cuisine)
      ) {
        return false;
      }

      // Difficulty filter
      if (
        filters.difficulty.length > 0 &&
        !filters.difficulty.includes(recipe.difficulty)
      ) {
        return false;
      }

      // Ingredients filter (recipe must contain ALL selected ingredients)
      if (filters.ingredients.length > 0) {
        const hasAllIngredients = filters.ingredients.every((ing) =>
          recipe.ingredients.some((recipeIng) =>
            recipeIng.toLowerCase().includes(ing.toLowerCase()),
          ),
        );
        if (!hasAllIngredients) return false;
      }

      // Cook time filter
      if (
        filters.maxCookTime !== null &&
        recipe.cookTime > filters.maxCookTime
      ) {
        return false;
      }

      // Dietary restrictions filter (check tags)
      if (filters.dietaryRestrictions.length > 0) {
        const hasAllRestrictions = filters.dietaryRestrictions.every(
          (restriction) =>
            recipe.tags.some((tag) =>
              tag.toLowerCase().includes(restriction.toLowerCase()),
            ),
        );
        if (!hasAllRestrictions) return false;
      }

      // Cooking status filter
      if (filters.cookingStatus === "cooked" && !recipe.cooked) {
        return false;
      }
      if (filters.cookingStatus === "wantToTry" && recipe.cooked) {
        return false;
      }

      return true;
    });
  }, [filters, recipes]);

  const activeFilterCount =
    filters.cuisine.length +
    filters.difficulty.length +
    filters.ingredients.length +
    (filters.maxCookTime !== null ? 1 : 0) +
    filters.dietaryRestrictions.length;

  const handleRecipeClick = (recipe: RecipeWithVideoSource) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <header className="border-border bg-muted/20 relative overflow-hidden border-b">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#grid)" />
            <defs>
              <pattern
                id="grid"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 8 0 L 0 0 0 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
          </svg>
        </div>

        <div className="container mx-auto pt-8 pb-16 md:pt-12 md:pb-24">
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            {/* Badge and Theme Toggle Row */}
            <div className="animate-in fade-in slide-in-from-bottom-4 relative flex items-center justify-center duration-500">
              <div className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm backdrop-blur-sm">
                <UtensilsCrossed className="h-4 w-4" />
                <span className="text-sm font-semibold tracking-wide">
                  Recipe Collection
                </span>
              </div>
              <div className="absolute right-0">
                <ThemeToggle />
              </div>
            </div>

            <h1 className="font-display text-foreground animate-in fade-in slide-in-from-bottom-6 text-5xl font-extrabold tracking-tight text-balance delay-100 duration-700 md:text-7xl">
              Discover <span className="text-primary italic">Delicious</span>{" "}
              <br /> Recipes
            </h1>

            <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-6 mx-auto max-w-2xl text-lg leading-relaxed delay-200 duration-700 md:text-xl">
              Explore our curated collection of recipes from around the world.
              Filter by cuisine, difficulty, or ingredients to find your perfect
              dish for any occasion.
            </p>

            {/* Search Bar */}
            <div className="animate-in fade-in slide-in-from-bottom-8 flex justify-center pt-6 delay-300 duration-700">
              <SearchBar
                value={filters.searchQuery}
                onChange={(value) =>
                  setFilters({ ...filters, searchQuery: value })
                }
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 md:py-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="bg-card shadow-card sticky top-8 rounded-xl p-6">
              <h2 className="font-display text-foreground mb-6 text-lg font-semibold">
                Filters
              </h2>
              <RecipeFilters
                filters={filters}
                onFilterChange={setFilters}
                availableCuisines={availableCuisines}
                availableIngredients={availableIngredients}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="mb-6 lg:hidden">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-primary-foreground ml-1 rounded-full px-2 py-0.5 text-xs">
                        {activeFilterCount}
                      </span>
                    )}
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

            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground font-body">
                <span className="text-foreground font-semibold">
                  {filteredRecipes.length}
                </span>{" "}
                {filteredRecipes.length === 1 ? "recipe" : "recipes"} found
              </p>

              {/* Active Filters Pills */}
              {activeFilterCount > 0 && (
                <div className="hidden items-center gap-2 md:flex">
                  {filters.cuisine.map((c) => (
                    <span
                      key={c}
                      className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {c}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            cuisine: filters.cuisine.filter((x) => x !== c),
                          })
                        }
                        title="Remove filter"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.difficulty.map((d) => (
                    <span
                      key={d}
                      className="bg-accent/20 text-accent-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {d}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            difficulty: filters.difficulty.filter(
                              (x) => x !== d,
                            ),
                          })
                        }
                        title="Remove filter"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recipe Grid */}
            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleRecipeClick(recipe)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <UtensilsCrossed className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="font-display text-foreground mb-2 text-xl font-semibold">
                  No recipes found
                </h3>
                <p className="text-muted-foreground mx-auto max-w-md">
                  Try adjusting your filters or search terms to find what you're
                  looking for.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setFilters({
                      cuisine: [],
                      difficulty: [],
                      ingredients: [],
                      searchQuery: "",
                      maxCookTime: null,
                      dietaryRestrictions: [],
                      cookingStatus: "all",
                    })
                  }
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
