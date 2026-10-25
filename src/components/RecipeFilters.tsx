import {
  COOKING_STATUS_OPTIONS,
  countActiveFilters,
  DIETARY_OPTIONS,
  DIFFICULTY_OPTIONS,
  EMPTY_FILTERS,
  TOTAL_TIME_OPTIONS,
} from "@/lib/recipe-filters";
import type {
  CookingStatus,
  FilterCriteria,
  RecipeDifficulty,
} from "@/lib/recipe-types";
import { Bookmark, ChefHat, Clock, Globe, Heart, Leaf } from "lucide-react";
import { FilterChip } from "./FilterChip";

interface RecipeFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  availableCuisines: string[];
  availableIngredients: string[];
  isLoggedIn: boolean;
}

const totalTimeOptions = [
  ...TOTAL_TIME_OPTIONS,
  { label: "Cualquier tiempo", value: null },
];

export function RecipeFilters({
  filters,
  onFilterChange,
  availableCuisines,
  availableIngredients,
  isLoggedIn,
}: Readonly<RecipeFiltersProps>) {
  const toggleCuisine = (cuisine: string) => {
    const newCuisines = filters.cuisine.includes(cuisine)
      ? filters.cuisine.filter((c) => c !== cuisine)
      : [...filters.cuisine, cuisine];
    onFilterChange({ ...filters, cuisine: newCuisines });
  };

  const toggleDifficulty = (difficulty: RecipeDifficulty) => {
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

  const setTotalTime = (value: number | null) => {
    onFilterChange({ ...filters, maxTotalTime: value });
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

  const hasActiveFilters = countActiveFilters(filters) > 0;

  // Keeps the search query; it has its own clear button
  const clearFilters = () => {
    onFilterChange({ ...EMPTY_FILTERS, searchQuery: filters.searchQuery });
  };

  return (
    <div className="space-y-6">
      {isLoggedIn ? (
        <div className="space-y-3">
          <div className="text-foreground flex items-center gap-2 text-sm font-medium">
            <Bookmark className="text-primary h-4 w-4" aria-hidden="true" />
            <span>Estado de Cocción</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COOKING_STATUS_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                isActive={filters.cookingStatus === option.value}
                onClick={() => setCookingStatus(option.value)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <ChefHat className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Dificultad</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <FilterChip
              key={difficulty.value}
              label={difficulty.label}
              isActive={filters.difficulty.includes(difficulty.value)}
              onClick={() => toggleDifficulty(difficulty.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Globe className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Cocina</span>
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

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Clock className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Tiempo Total</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {totalTimeOptions.map((option) => (
            <FilterChip
              key={option.label}
              label={option.label}
              isActive={filters.maxTotalTime === option.value}
              onClick={() => setTotalTime(option.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Heart className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Dieta</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((restriction) => (
            <FilterChip
              key={restriction.value}
              label={restriction.label}
              isActive={filters.dietaryRestrictions.includes(restriction.value)}
              onClick={() => toggleDietaryRestriction(restriction.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Leaf className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Ingredientes Clave</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableIngredients.map((ingredient) => (
            <FilterChip
              key={ingredient}
              label={ingredient}
              isActive={filters.ingredients.includes(ingredient)}
              onClick={() => toggleIngredient(ingredient)}
            />
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-primary hover:text-primary/80 cursor-pointer text-sm underline underline-offset-2 transition-colors"
        >
          Borrar todos los filtros
        </button>
      )}
    </div>
  );
}
