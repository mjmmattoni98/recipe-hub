import { PlatformIcon } from "@/components/PlatformIcon";
import { useToggleCooked } from "@/components/recipes/use-toggle-cooked";
import {
  DIFFICULTY_LABELS,
  type RecipeWithVideoSource,
} from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RecipeCardProps {
  recipe: RecipeWithVideoSource;
  isLoggedIn: boolean;
  // Cards in the first row are above the fold, so their images shouldn't wait
  // for lazy loading.
  eager?: boolean;
}

const difficultyClasses = {
  Easy: "badge-easy",
  Medium: "badge-medium",
  Hard: "badge-hard",
};

export function RecipeCard({
  recipe,
  isLoggedIn,
  eager = false,
}: Readonly<RecipeCardProps>) {
  const toggleCooked = useToggleCooked();

  return (
    // The title link stretches over the whole card (after:inset-0), which
    // keeps the cooked toggle a sibling of the link instead of nesting a
    // button inside it.
    <article className="recipe-card group border-border/40 has-[a:focus-visible]:ring-ring border has-[a:focus-visible]:ring-2">
      {/* Image */}
      <div className="relative aspect-4/3 overflow-hidden">
        <Image
          src={recipe.image}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        {/* Cooked toggle — it means nothing to guests, so they don't get it */}
        {isLoggedIn ? (
          <button
            onClick={() =>
              toggleCooked.mutate({
                id: recipe.id,
                cooked: !recipe.cookedByMe,
              })
            }
            type="button"
            aria-label={
              recipe.cookedByMe
                ? "Cocinada (marcar como pendiente)"
                : "Pendiente (marcar como cocinada)"
            }
            className={cn(
              "absolute top-3 left-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105",
              recipe.cookedByMe
                ? "border border-emerald-400/30 bg-emerald-500/90 text-white"
                : "border border-white/20 bg-white/20 text-white",
            )}
          >
            <CheckCircle
              className={cn(
                "h-3.5 w-3.5",
                recipe.cookedByMe ? "text-white" : "text-white/70",
              )}
              aria-hidden="true"
            />
            <span>{recipe.cookedByMe ? "Cocinada" : "Pendiente"}</span>
          </button>
        ) : null}

        <span
          className={cn(
            "badge-difficulty absolute top-3 right-3 shadow-lg backdrop-blur-sm",
            difficultyClasses[recipe.difficulty],
          )}
        >
          {DIFFICULTY_LABELS[recipe.difficulty]}
        </span>

        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
          <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
            {recipe.cuisine}
          </span>

          {recipe.videoSource && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <PlatformIcon
                platform={recipe.videoSource.platform}
                className="h-4 w-4"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-foreground group-hover:text-primary line-clamp-2 text-lg leading-snug font-semibold transition-colors duration-300">
          <Link
            href={`/recipes/${recipe.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {recipe.title}
          </Link>
        </h3>

        <p className="text-muted-foreground font-body mt-2 line-clamp-2 text-sm leading-relaxed">
          {recipe.description}
        </p>

        <div className="text-muted-foreground border-border/50 mt-4 flex items-center gap-4 border-t pt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="text-primary/60 h-4 w-4" aria-hidden="true" />
            <span className="font-body font-medium">
              {recipe.cookTime + recipe.prepTime} min
            </span>
          </div>
          <div className="bg-border h-3.5 w-px" />
          <div className="flex items-center gap-1.5">
            <Users className="text-primary/60 h-4 w-4" aria-hidden="true" />
            <span className="font-body font-medium">
              {recipe.servings} raciones
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
