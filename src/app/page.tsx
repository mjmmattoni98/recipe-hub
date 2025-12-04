"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { RecipeFilters } from "@/components/RecipeFilters";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeModal } from "@/components/RecipeModal";
import type { Recipe, FilterCriteria } from "@/types/recipe";
import recipesData from "@/data/recipes.json";
import { UtensilsCrossed, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const recipes: Recipe[] = recipesData as Recipe[];

export default function Home() {
  const [filters, setFilters] = useState<FilterCriteria>({
    cuisine: [],
    difficulty: [],
    ingredients: [],
    searchQuery: "",
    maxCookTime: null,
    dietaryRestrictions: [],
  });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique values for filters
  const availableCuisines = useMemo(
    () => [...new Set(recipes.map((r) => r.cuisine))].sort(),
    []
  );

  const availableIngredients = useMemo(() => {
    const allIngredients = recipes.flatMap((r) => r.ingredients);
    const counts = allIngredients.reduce((acc, ing) => {
      acc[ing] = (acc[ing] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([ing]) => ing);
  }, []);

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
            recipeIng.toLowerCase().includes(ing.toLowerCase())
          )
        );
        if (!hasAllIngredients) return false;
      }

      // Cook time filter
      if (filters.maxCookTime !== null && recipe.cookTime > filters.maxCookTime) {
        return false;
      }

      // Dietary restrictions filter (check tags)
      if (filters.dietaryRestrictions.length > 0) {
        const hasAllRestrictions = filters.dietaryRestrictions.every((restriction) =>
          recipe.tags.some((tag) =>
            tag.toLowerCase().includes(restriction.toLowerCase())
          )
        );
        if (!hasAllRestrictions) return false;
      }

      return true;
    });
  }, [filters]);

  const activeFilterCount =
    filters.cuisine.length + filters.difficulty.length + filters.ingredients.length +
    (filters.maxCookTime !== null ? 1 : 0) + filters.dietaryRestrictions.length;

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative gradient-hero border-b border-border">
        <div className="container py-12 md:py-20 mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-sm font-medium">Recipe Collection</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground text-balance animate-in fade-in slide-in-from-bottom-4 duration-500">
              Discover Delicious Recipes
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Explore our curated collection of recipes from around the world. 
              Filter by cuisine, difficulty, or ingredients to find your perfect dish.
            </p>

            {/* Search Bar */}
            <div className="flex justify-center pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <SearchBar
                value={filters.searchQuery}
                onChange={(value) => setFilters({ ...filters, searchQuery: value })}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12 mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-8 bg-card rounded-xl p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-6">
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
            <div className="lg:hidden mb-6">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-card">
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground font-body">
                <span className="font-semibold text-foreground">{filteredRecipes.length}</span>{" "}
                {filteredRecipes.length === 1 ? "recipe" : "recipes"} found
              </p>

              {/* Active Filters Pills */}
              {activeFilterCount > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  {filters.cuisine.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                    >
                      {c}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            cuisine: filters.cuisine.filter((x) => x !== c),
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.difficulty.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-xs font-medium"
                    >
                      {d}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            difficulty: filters.difficulty.filter((x) => x !== d),
                          })
                        }
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No recipes found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try adjusting your filters or search terms to find what you're looking for.
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
