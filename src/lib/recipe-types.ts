import type {
  Recipe,
  RecipeDifficulty,
  VideoSource,
  VideoPlatform,
} from "../../generated/prisma/client";
import type { RecipeAppliance } from "./recipe-appliances";

// Recipe with VideoSource relation included and the viewer's own cooked status.
// The author id is never sent to the client.
export type RecipeWithVideoSource = Omit<Recipe, "createdById"> & {
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
  appliance: RecipeAppliance | null;
  cuisine: string[];
  difficulty: RecipeDifficulty[];
  searchQuery: string;
  // Upper bound on prepTime + cookTime, matching the time shown on cards
  maxTotalTime: number | null;
  dietaryRestrictions: string[];
  cookingStatus: CookingStatus;
};
