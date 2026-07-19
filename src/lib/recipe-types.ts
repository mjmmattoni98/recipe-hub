import type {
  Recipe,
  VideoSource,
  VideoPlatform,
} from "../../generated/prisma/client";

// Recipe with VideoSource relation included and the viewer's own cooked status
export type RecipeWithVideoSource = Recipe & {
  videoSource: VideoSource | null;
  cookedByMe: boolean;
};

// Re-export the VideoPlatform enum type
export type { VideoPlatform };

// FilterCriteria for recipe filtering in the UI
export type CookingStatus = "all" | "cooked" | "wantToTry";

export type FilterCriteria = {
  cuisine: string[];
  difficulty: string[];
  ingredients: string[];
  searchQuery: string;
  maxCookTime: number | null;
  dietaryRestrictions: string[];
  cookingStatus: CookingStatus;
};
