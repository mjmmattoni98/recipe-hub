import type { RecipeWithVideoSource } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { Clock, Users } from "lucide-react";

interface RecipeCardProps {
  recipe: RecipeWithVideoSource;
  onClick: () => void;
  index: number;
}

export function RecipeCard({
  recipe,
  onClick,
  index,
}: Readonly<RecipeCardProps>) {
  const difficultyClass = {
    Easy: "badge-easy",
    Medium: "badge-medium",
    Hard: "badge-hard",
  }[recipe.difficulty];

  return (
    <article
      onClick={onClick}
      className="recipe-card group cursor-pointer"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="from-foreground/60 absolute inset-0 bg-linear-to-t via-transparent to-transparent" />

        {/* Difficulty Badge */}
        <span
          className={cn(
            "badge-difficulty absolute top-3 right-3",
            difficultyClass,
          )}
        >
          {recipe.difficulty}
        </span>

        {/* Cuisine Tag */}
        <span className="bg-background/90 text-foreground absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm">
          {recipe.cuisine}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <h3 className="font-display text-foreground group-hover:text-primary line-clamp-2 text-xl leading-tight font-semibold transition-colors">
          {recipe.title}
        </h3>

        <p className="text-muted-foreground font-body line-clamp-2 text-sm">
          {recipe.description}
        </p>

        {/* Meta Info */}
        <div className="text-muted-foreground flex items-center gap-4 pt-2 text-sm">
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
