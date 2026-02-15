import { PlatformIcon } from "@/components/PlatformIcon";
import type { RecipeWithVideoSource } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { CheckCircle, Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RecipeCardProps {
  recipe: RecipeWithVideoSource;
  index: number;
  isLoggedIn: boolean;
}

export function RecipeCard({
  recipe,
  index,
  isLoggedIn,
}: Readonly<RecipeCardProps>) {
  const router = useRouter();
  const utils = api.useUtils();
  const toggleCooked = api.recipe.toggleCooked.useMutation({
    onSuccess: () => {
      router.refresh();
      utils.recipe.getAll.invalidate();
      toast.success("Estado de la receta actualizado");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const difficultyLabels = {
    Easy: "Fácil",
    Medium: "Media",
    Hard: "Difícil",
  };

  const difficultyClass = {
    Easy: "badge-easy",
    Medium: "badge-medium",
    Hard: "badge-hard",
  }[recipe.difficulty];

  const handleToggleCooked = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;

    toggleCooked.mutate({
      id: recipe.id,
      cooked: !recipe.cooked,
    });
  };

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <article
        className="recipe-card border-border/40 border"
        style={{
          animationDelay: `${index * 80}ms`,
          animationFillMode: "backwards",
        }}
      >
        {/* Image */}
        <div className="relative aspect-4/3 overflow-hidden">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

          {/* Cooked Badge */}
          <button
            onClick={handleToggleCooked}
            type="button"
            disabled={!isLoggedIn}
            className={cn(
              "absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-300",
              recipe.cooked
                ? "border border-emerald-400/30 bg-emerald-500/90 text-white"
                : "border border-white/20 bg-white/20 text-white",
              isLoggedIn ? "cursor-pointer hover:scale-105" : "cursor-default",
            )}
          >
            <CheckCircle
              className={cn(
                "h-3.5 w-3.5",
                recipe.cooked ? "text-white" : "text-white/70",
              )}
              aria-hidden="true"
            />
            <span>{recipe.cooked ? "Cocinada" : "Pendiente"}</span>
          </button>

          <span
            className={cn(
              "badge-difficulty absolute top-3 right-3 shadow-lg backdrop-blur-sm",
              difficultyClass,
            )}
          >
            {difficultyLabels[recipe.difficulty]}
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
            {recipe.title}
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
    </Link>
  );
}
