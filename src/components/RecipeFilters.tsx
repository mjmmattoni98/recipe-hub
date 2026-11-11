import { APPLIANCE_OPTIONS } from "@/lib/recipe-appliances";
import {
  COOKING_STATUS_OPTIONS,
  DIETARY_OPTIONS,
  DIFFICULTY_OPTIONS,
  TOTAL_TIME_OPTIONS,
} from "@/lib/recipe-filters";
import type { FilterCriteria } from "@/lib/recipe-types";
import type { ReactNode } from "react";
import { FilterChip } from "./FilterChip";

interface RecipeFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  availableCuisines: string[];
  isLoggedIn: boolean;
}

const totalTimeOptions = [
  ...TOTAL_TIME_OPTIONS,
  { label: "Sin límite", value: null },
];

const toggle = <T,>(values: T[], value: T) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

function FilterSection({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div
      className="border-t py-6 first:border-t-0 first:pt-0"
      role="group"
      aria-label={title}
    >
      <h3 className="eyebrow text-muted-foreground mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function RecipeFilters({
  filters,
  onFilterChange,
  availableCuisines,
  isLoggedIn,
}: Readonly<RecipeFiltersProps>) {
  return (
    <div>
      <FilterSection title="Aparato">
        {APPLIANCE_OPTIONS.map((option) => (
          <FilterChip
            key={option.label}
            label={option.label}
            isActive={filters.appliance === option.value}
            onClick={() =>
              onFilterChange({ ...filters, appliance: option.value })
            }
          />
        ))}
      </FilterSection>

      {isLoggedIn ? (
        <FilterSection title="En mi cocina">
          {COOKING_STATUS_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isActive={filters.cookingStatus === option.value}
              onClick={() =>
                onFilterChange({ ...filters, cookingStatus: option.value })
              }
            />
          ))}
        </FilterSection>
      ) : null}

      <FilterSection title="Tiempo total">
        {totalTimeOptions.map((option) => (
          <FilterChip
            key={option.label}
            label={option.label}
            isActive={filters.maxTotalTime === option.value}
            onClick={() =>
              onFilterChange({ ...filters, maxTotalTime: option.value })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Dificultad">
        {DIFFICULTY_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isActive={filters.difficulty.includes(option.value)}
            onClick={() =>
              onFilterChange({
                ...filters,
                difficulty: toggle(filters.difficulty, option.value),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Dieta">
        {DIETARY_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isActive={filters.dietaryRestrictions.includes(option.value)}
            onClick={() =>
              onFilterChange({
                ...filters,
                dietaryRestrictions: toggle(
                  filters.dietaryRestrictions,
                  option.value,
                ),
              })
            }
          />
        ))}
      </FilterSection>

      {availableCuisines.length > 0 ? (
        <FilterSection title="Cocina">
          {availableCuisines.map((cuisine) => (
            <FilterChip
              key={cuisine}
              label={cuisine}
              isActive={filters.cuisine.includes(cuisine)}
              onClick={() =>
                onFilterChange({
                  ...filters,
                  cuisine: toggle(filters.cuisine, cuisine),
                })
              }
            />
          ))}
        </FilterSection>
      ) : null}
    </div>
  );
}
