import type { CookingStatus, FilterCriteria } from "@/lib/recipe-types";
import { Bookmark, ChefHat, Clock, Globe, Heart, Leaf } from "lucide-react";
import { FilterChip } from "./FilterChip";

interface RecipeFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  availableCuisines: string[];
  availableIngredients: string[];
}

const difficulties = [
  { label: "Fácil", value: "Easy" },
  { label: "Media", value: "Medium" },
  { label: "Difícil", value: "Hard" },
];
const cookTimeOptions = [
  { label: "Menos de 15 min", value: 15 },
  { label: "Menos de 30 min", value: 30 },
  { label: "Menos de 1 hora", value: 60 },
  { label: "Cualquier tiempo", value: null },
];
const dietaryOptions = [
  { label: "Vegetariana", value: "Vegetarian" },
  { label: "Vegana", value: "Vegan" },
  { label: "Sin Gluten", value: "Gluten-Free" },
];
const cookingStatusOptions: { label: string; value: CookingStatus }[] = [
  { label: "Todas las Recetas", value: "all" },
  { label: "Ya Cocinadas", value: "cooked" },
  { label: "Pendientes", value: "wantToTry" },
];

export function RecipeFilters({
  filters,
  onFilterChange,
  availableCuisines,
  availableIngredients,
}: Readonly<RecipeFiltersProps>) {
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
      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Bookmark className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Estado de Cocción</span>
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

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <ChefHat className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Dificultad</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
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
          <span>Tiempo de Cocción</span>
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

      <div className="space-y-3">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Heart className="text-primary h-4 w-4" aria-hidden="true" />
          <span>Dieta</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((restriction) => (
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
