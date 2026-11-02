import { PlatformIcon } from "@/components/PlatformIcon";
import { DifficultyMeter } from "@/components/recipes/DifficultyMeter";
import { useToggleCooked } from "@/components/recipes/use-toggle-cooked";
import type { RecipeWithVideoSource } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RecipeCardProps {
  recipe: RecipeWithVideoSource;
  isLoggedIn: boolean;
  // Cards in the first row are above the fold, so their images shouldn't wait
  // for lazy loading.
  eager?: boolean;
}

export function RecipeCard({
  recipe,
  isLoggedIn,
  eager = false,
}: Readonly<RecipeCardProps>) {
  const toggleCooked = useToggleCooked();
  const cooked = recipe.cookedByMe;

  return (
    // The title link stretches over the whole card (after:inset-0), which
    // keeps the cooked toggle a sibling of the link instead of nesting a
    // button inside it.
    <article className="group has-[a:focus-visible]:outline-ring relative rounded-md outline-offset-4 has-[a:focus-visible]:outline-2">
      <div className="bg-muted relative aspect-4/3 overflow-hidden rounded-md">
        <Image
          src={recipe.image}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />

        {recipe.videoSource ? (
          <span
            className="absolute bottom-3 left-3 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            title={`Con vídeo de ${recipe.videoSource.platform}`}
          >
            <PlatformIcon
              platform={recipe.videoSource.platform}
              className="size-3.5"
            />
            <span className="sr-only">
              Con vídeo de {recipe.videoSource.platform}
            </span>
          </span>
        ) : null}
      </div>

      {/* Cooked toggle — it means nothing to guests, so they don't get it */}
      {isLoggedIn ? (
        <button
          onClick={() =>
            toggleCooked.mutate({ id: recipe.id, cooked: !cooked })
          }
          type="button"
          aria-pressed={cooked}
          aria-label={
            cooked
              ? `${recipe.title}: cocinada (marcar como pendiente)`
              : `${recipe.title}: marcar como cocinada`
          }
          className={cn(
            "focus-visible:ring-ring absolute top-3 left-3 z-10 flex h-8 cursor-pointer items-center gap-1.5 rounded-full text-xs font-semibold transition-[opacity,background-color] outline-none focus-visible:ring-2",
            cooked
              ? "bg-highlight text-highlight-foreground px-3"
              : "bg-background/85 text-foreground hover:bg-background w-8 justify-center backdrop-blur-sm focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
          )}
        >
          <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          {cooked ? <span>Cocinada</span> : null}
        </button>
      ) : null}

      <div className="pt-4">
        <p className="eyebrow text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="max-w-[12rem] truncate">{recipe.cuisine}</span>
          <span aria-hidden="true">·</span>
          <span>{recipe.cookTime + recipe.prepTime} min</span>
          <span aria-hidden="true">·</span>
          <DifficultyMeter difficulty={recipe.difficulty} />
        </p>

        <h3 className="font-display text-foreground mt-2 text-[1.7rem] leading-[1.05] tracking-tight text-balance">
          <Link
            href={`/recipes/${recipe.id}`}
            className="decoration-primary/50 decoration-1 underline-offset-[5px] group-hover:underline after:absolute after:inset-0 focus-visible:outline-none"
          >
            {recipe.title}
          </Link>
        </h3>

        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-relaxed">
          {recipe.description}
        </p>
      </div>
    </article>
  );
}
