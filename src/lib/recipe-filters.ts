import {
  DIFFICULTY_LABELS,
  type CookingStatus,
  type FilterCriteria,
  type RecipeDifficulty,
} from "@/lib/recipe-types";

// The home page keeps its filters in the URL so they survive navigation and
// can be shared. The server page and the client both go through this module,
// so the URL, the tRPC query input and the server prefetch always agree.

export const RECIPE_PAGE_SIZE = 12;

export const DIFFICULTY_OPTIONS = (
  Object.keys(DIFFICULTY_LABELS) as RecipeDifficulty[]
).map((value) => ({ label: DIFFICULTY_LABELS[value], value }));

export const TOTAL_TIME_OPTIONS = [
  { label: "Hasta 15 min", value: 15 },
  { label: "Hasta 30 min", value: 30 },
  { label: "Hasta 1 hora", value: 60 },
];

export const DIETARY_OPTIONS = [
  { label: "Vegetariana", value: "Vegetarian" },
  { label: "Vegana", value: "Vegan" },
  { label: "Sin Gluten", value: "Gluten-Free" },
];

export const COOKING_STATUS_OPTIONS: { label: string; value: CookingStatus }[] =
  [
    { label: "Todas las Recetas", value: "all" },
    { label: "Ya Cocinadas", value: "cooked" },
    { label: "Pendientes", value: "wantToTry" },
  ];

const PARAMS = {
  search: "q",
  cuisine: "cuisine",
  difficulty: "difficulty",
  ingredient: "ingredient",
  maxTotalTime: "maxTime",
  diet: "diet",
  status: "status",
} as const;

export const EMPTY_FILTERS: FilterCriteria = {
  cuisine: [],
  difficulty: [],
  ingredients: [],
  searchQuery: "",
  maxTotalTime: null,
  dietaryRestrictions: [],
  cookingStatus: "all",
};

type ReadableSearchParams = Pick<URLSearchParams, "get" | "getAll">;

const isDifficulty = (value: string): value is RecipeDifficulty =>
  value in DIFFICULTY_LABELS;

const uniqueValues = (values: string[]) => [
  ...new Set(values.map((value) => value.trim()).filter(Boolean)),
];

export function searchParamsFromRecord(
  record: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    for (const item of [value].flat()) {
      if (item !== undefined) params.append(key, item);
    }
  }
  return params;
}

// Cooking status only means something for a signed-in viewer, so guests
// always get "all" regardless of what the URL says.
export function parseRecipeFilters(
  params: ReadableSearchParams,
  isLoggedIn: boolean,
): FilterCriteria {
  const maxTotalTime = Number(params.get(PARAMS.maxTotalTime));
  const status = params.get(PARAMS.status);

  return {
    searchQuery: params.get(PARAMS.search)?.trim() ?? "",
    cuisine: uniqueValues(params.getAll(PARAMS.cuisine)),
    difficulty: uniqueValues(params.getAll(PARAMS.difficulty)).filter(
      isDifficulty,
    ),
    ingredients: uniqueValues(params.getAll(PARAMS.ingredient)),
    maxTotalTime:
      Number.isInteger(maxTotalTime) && maxTotalTime > 0 ? maxTotalTime : null,
    dietaryRestrictions: uniqueValues(params.getAll(PARAMS.diet)),
    cookingStatus:
      isLoggedIn && (status === "cooked" || status === "wantToTry")
        ? status
        : "all",
  };
}

export function recipeFiltersToSearchParams(filters: FilterCriteria) {
  const params = new URLSearchParams();
  const searchQuery = filters.searchQuery.trim();
  if (searchQuery) params.set(PARAMS.search, searchQuery);
  for (const value of filters.cuisine) params.append(PARAMS.cuisine, value);
  for (const value of filters.difficulty) {
    params.append(PARAMS.difficulty, value);
  }
  for (const value of filters.ingredients) {
    params.append(PARAMS.ingredient, value);
  }
  if (filters.maxTotalTime !== null) {
    params.set(PARAMS.maxTotalTime, String(filters.maxTotalTime));
  }
  for (const value of filters.dietaryRestrictions) {
    params.append(PARAMS.diet, value);
  }
  if (filters.cookingStatus !== "all") {
    params.set(PARAMS.status, filters.cookingStatus);
  }
  return params;
}

// Empty filters are left out rather than sent as empty arrays, so the same
// filters always produce the same query key on the server and the client.
export function recipeListInput(filters: FilterCriteria) {
  return {
    limit: RECIPE_PAGE_SIZE,
    searchQuery: filters.searchQuery.trim() || undefined,
    cuisine: filters.cuisine.length ? filters.cuisine : undefined,
    difficulty: filters.difficulty.length ? filters.difficulty : undefined,
    ingredients: filters.ingredients.length ? filters.ingredients : undefined,
    maxTotalTime: filters.maxTotalTime ?? undefined,
    dietaryRestrictions: filters.dietaryRestrictions.length
      ? filters.dietaryRestrictions
      : undefined,
    cookingStatus: filters.cookingStatus,
  };
}

// Counts everything the filter panel controls; the search box is separate.
export function countActiveFilters(filters: FilterCriteria) {
  return (
    filters.cuisine.length +
    filters.difficulty.length +
    filters.ingredients.length +
    (filters.maxTotalTime === null ? 0 : 1) +
    filters.dietaryRestrictions.length +
    (filters.cookingStatus === "all" ? 0 : 1)
  );
}

export function totalTimeLabel(minutes: number) {
  return (
    TOTAL_TIME_OPTIONS.find((option) => option.value === minutes)?.label ??
    `Hasta ${minutes} min`
  );
}
