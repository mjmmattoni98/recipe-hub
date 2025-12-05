import type { CookingStatus, FilterCriteria } from "@/lib/recipe-types";
import { Bookmark, ChefHat, Clock, Globe, Heart, Leaf } from "lucide-react";
import { FilterChip } from "./FilterChip";

interface RecipeFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  availableCuisines: string[];
  availableIngredients: string[];
}

const difficulties = ["Easy", "Medium", "Hard"];
const cookTimeOptions = [
  { label: "Under 15 min", value: 15 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 1 hour", value: 60 },
  { label: "Any time", value: null },
];
const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-Free"];
const cookingStatusOptions: { label: string; value: CookingStatus }[] = [
  { label: "All Recipes", value: "all" },
  { label: "Already Cooked", value: "cooked" },
  { label: "Want to Try", value: "wantToTry" },
];

export function RecipeFilters({
  filters,
  onFilterChange,
  availableCuisines,
  availableIngredients,
}: RecipeFiltersProps) {
  const toggleCuisine = (cuisine: string) => {
    const newCuisines = filters.cuisine.includes(cuisine)
      ? filters.cuisine.filter((c) => c !== cuisine)
      : [...filters.cuisine, cuisine];
    onFilterChange({ ...filters, cuisine: newCuisines });
  };

  const toggleDifficulty = (difficulty: string) => {
    const newDifficulties = filters.difficulty.includes(difficulty)
      ? filters.difficulty.filter((d) => d !== difficulty)
      : [...filters.difficulty, difficulty];
    onFilterChange({ ...filters, difficulty: newDifficulties });
  };

  const toggleIngredient = (ingredient: string) => {
    const newIngredients = filters.ingredients.includes(ingredient)
      ? filters.ingredients.filter((i) => i !== ingredient)
      : [...filters.ingredients, ingredient];
    onFilterChange({ ...filters, ingredients: newIngredients });
  };

  const setCookTime = (value: number | null) => {
    onFilterChange({ ...filters, maxCookTime: value });
  };

  const toggleDietaryRestriction = (restriction: string) => {
    const newRestrictions = filters.dietaryRestrictions.includes(restriction)
      ? filters.dietaryRestrictions.filter((r) => r !== restriction)
      : [...filters.dietaryRestrictions, restriction];
    onFilterChange({ ...filters, dietaryRestrictions: newRestrictions });
  };

  const setCookingStatus = (status: CookingStatus) => {
    onFilterChange({ ...filters, cookingStatus: status });
  };

  const hasActiveFilters =
    filters.cuisine.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.ingredients.length > 0 ||
    filters.maxCookTime !== null ||
    filters.dietaryRestrictions.length > 0 ||
    filters.cookingStatus !== "all";

  const clearFilters = () => {
    onFilterChange({
      ...filters,
      cuisine: [],
      difficulty: [],
      ingredients: [],
      maxCookTime: null,
      dietaryRestrictions: [],
      cookingStatus: "all",
    });
  };

  return (
    <div className="space-y-6">
      {/* Cooking Status Filter */}
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Bookmark className="text-primary h-4 w-4" />
          <span>Cooking Status</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {cookingStatusOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isActive={filters.cookingStatus === option.value}
              onClick={() => setCookingStatus(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <ChefHat className="text-primary h-4 w-4" />
          <span>Difficulty</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <FilterChip
              key={difficulty}
              label={difficulty}
              isActive={filters.difficulty.includes(difficulty)}
              onClick={() => toggleDifficulty(difficulty)}
            />
          ))}
        </div>
      </div>

      {/* Cuisine Filter */}
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Globe className="text-primary h-4 w-4" />
          <span>Cuisine</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableCuisines.map((cuisine) => (
            <FilterChip
              key={cuisine}
              label={cuisine}
              isActive={filters.cuisine.includes(cuisine)}
              onClick={() => toggleCuisine(cuisine)}
            />
          ))}
        </div>
      </div>

      {/* Cook Time Filter */}
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Clock className="text-primary h-4 w-4" />
          <span>Cook Time</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {cookTimeOptions.map((option) => (
            <FilterChip
              key={option.label}
              label={option.label}
              isActive={filters.maxCookTime === option.value}
              onClick={() => setCookTime(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Dietary Restrictions Filter */}
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Heart className="text-primary h-4 w-4" />
          <span>Dietary</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((restriction) => (
            <FilterChip
              key={restriction}
              label={restriction}
              isActive={filters.dietaryRestrictions.includes(restriction)}
              onClick={() => toggleDietaryRestriction(restriction)}
            />
          ))}
        </div>
      </div>

      {/* Ingredient Filter */}
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Leaf className="text-primary h-4 w-4" />
          <span>Key Ingredients</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableIngredients.slice(0, 12).map((ingredient) => (
            <FilterChip
              key={ingredient}
              label={ingredient}
              isActive={filters.ingredients.includes(ingredient)}
              onClick={() => toggleIngredient(ingredient)}
            />
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-primary hover:text-primary/80 text-sm underline underline-offset-2 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
