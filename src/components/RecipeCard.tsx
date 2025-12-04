import { Clock, Users } from "lucide-react";
import type { Recipe } from "@/types/recipe";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  index: number;
}

export function RecipeCard({ recipe, onClick, index }: RecipeCardProps) {
  const difficultyClass = {
    Easy: "badge-easy",
    Medium: "badge-medium",
    Hard: "badge-hard",
  }[recipe.difficulty];

  return (
    <article
      onClick={onClick}
      className="recipe-card cursor-pointer group"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Difficulty Badge */}
        <span className={cn("badge-difficulty absolute top-3 right-3", difficultyClass)}>
          {recipe.difficulty}
        </span>

        {/* Cuisine Tag */}
        <span className="absolute top-3 left-3 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
          {recipe.cuisine}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-display text-xl font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 font-body">
          {recipe.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{recipe.cookTime + recipe.prepTime} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>
      </div>
    </article>
  );
}
