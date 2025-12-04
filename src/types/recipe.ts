export interface VideoSource {
  platform: 'YouTube' | 'Instagram' | 'TikTok';
  url: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cookTime: number;
  prepTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  image: string;
  videoSource: VideoSource;
  tags: string[];
}

export type FilterCriteria = {
  cuisine: string[];
  difficulty: string[];
  ingredients: string[];
  searchQuery: string;
  maxCookTime: number | null;
  dietaryRestrictions: string[];
};
