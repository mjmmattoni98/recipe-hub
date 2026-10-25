import type {
  Recipe,
  RecipeDifficulty,
  VideoSource,
  VideoPlatform,
} from "../../generated/prisma/client";

// Recipe with VideoSource relation included and the viewer's own cooked status
export type RecipeWithVideoSource = Recipe & {
  videoSource: VideoSource | null;
  cookedByMe: boolean;
};

// Re-export the enum types
export type { RecipeDifficulty, VideoPlatform };

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  Easy: "Fácil",
  Medium: "Media",
  Hard: "Difícil",
};

// FilterCriteria for recipe filtering in the UI
export type CookingStatus = "all" | "cooked" | "wantToTry";

export type FilterCriteria = {
  cuisine: string[];
  difficulty: RecipeDifficulty[];
  ingredients: string[];
  searchQuery: string;
  // Upper bound on prepTime + cookTime, matching the time shown on cards
  maxTotalTime: number | null;
  dietaryRestrictions: string[];
  cookingStatus: CookingStatus;
};
