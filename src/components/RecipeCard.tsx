import { PlatformIcon } from "@/components/PlatformIcon";
import type { RecipeWithVideoSource } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { CheckCircle, Clock, Users } from "lucide-react";
import Image from "next/image";

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
  const utils = api.useUtils();
  const toggleCooked = api.recipe.toggleCooked.useMutation({
    onSuccess: () => {
      void utils.recipe.getAll.invalidate();
    },
  });

  const handleToggleCooked = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCooked.mutate({ id: recipe.id });
  };

  const difficultyClass = {
    Easy: "badge-easy",
    Medium: "badge-medium",
    Hard: "badge-hard",
  }[recipe.difficulty];

  return (
    <article
      onClick={onClick}
      className="recipe-card group border-border/50 bg-card hover:border-primary/50 cursor-pointer border"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-70" />

        {/* Cooked Badge */}
        <button
          onClick={handleToggleCooked}
          className={cn(
            "absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105",
            recipe.cooked
              ? "border border-green-400/50 bg-green-500/90 text-white"
              : "bg-background/90 text-foreground border-border/50 hover:bg-primary/20 hover:border-primary/50 border",
          )}
          title={recipe.cooked ? "Mark as want to try" : "Mark as cooked"}
        >
          <CheckCircle
            className={cn(
              "h-3.5 w-3.5",
              recipe.cooked ? "text-white" : "text-muted-foreground",
            )}
          />
          <span>{recipe.cooked ? "Cooked" : "Want to try"}</span>
        </button>

        {/* Difficulty Badge */}
        <span
          className={cn(
            "badge-difficulty absolute top-3 right-3 shadow-sm",
            difficultyClass,
          )}
        >
          {recipe.difficulty}
        </span>

        {/* Cuisine Tag */}
        <span className="bg-background/90 text-foreground border-border/50 absolute bottom-3 left-3 rounded-full border px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
          {recipe.cuisine}
        </span>

        {/* Play Icon / Video Source Indicator */}
        {recipe.videoSource && (
          <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
            <PlatformIcon
              platform={recipe.videoSource.platform}
              className="h-4 w-4"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <h3 className="font-display text-foreground group-hover:text-primary line-clamp-2 text-xl leading-tight font-semibold transition-colors duration-200">
          {recipe.title}
        </h3>

        <p className="text-muted-foreground font-body line-clamp-2 text-sm">
          {recipe.description}
        </p>

        {/* Meta Info */}
        <div className="text-muted-foreground border-border/50 mt-4 flex items-center gap-4 border-t pt-2 text-sm">
          <div className="mt-3 flex items-center gap-1.5">
            <Clock className="text-primary/70 h-4 w-4" />
            <span>{recipe.cookTime + recipe.prepTime} min</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Users className="text-primary/70 h-4 w-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>
      </div>
    </article>
  );
}
