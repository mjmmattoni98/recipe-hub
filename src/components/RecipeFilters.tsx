import { FilterChip } from "./FilterChip";
import type { FilterCriteria } from "@/lib/recipe-types";
import { ChefHat, Globe, Leaf, Clock, Heart } from "lucide-react";

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

  const hasActiveFilters =
    filters.cuisine.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.ingredients.length > 0 ||
    filters.maxCookTime !== null ||
    filters.dietaryRestrictions.length > 0;

  const clearFilters = () => {
    onFilterChange({
      ...filters,
      cuisine: [],
      difficulty: [],
      ingredients: [],
      maxCookTime: null,
      dietaryRestrictions: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Difficulty Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ChefHat className="h-4 w-4 text-primary" />
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
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="h-4 w-4 text-primary" />
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
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-primary" />
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
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Heart className="h-4 w-4 text-primary" />
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
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Leaf className="h-4 w-4 text-primary" />
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
          className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
