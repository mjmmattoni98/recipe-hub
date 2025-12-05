import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecipeWithVideoSource } from "@/lib/recipe-types";
import { cn } from "@/lib/utils";
import { Clock, ExternalLink, Users, X } from "lucide-react";
import Image from "next/image";
import { PlatformIcon } from "./PlatformIcon";

interface RecipeModalProps {
  recipe: RecipeWithVideoSource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({
  recipe,
  isOpen,
  onClose,
}: Readonly<RecipeModalProps>) {
  if (!recipe) return null;

  const difficultyClass = {
    Easy: "badge-easy",
    Medium: "badge-medium",
    Hard: "badge-hard",
  }[recipe.difficulty];

  const platformClass = recipe.videoSource
    ? {
        YouTube: "platform-youtube",
        Instagram: "platform-instagram",
        TikTok: "platform-tiktok",
      }[recipe.videoSource.platform]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="bg-card border-border max-h-[90vh] max-w-3xl overflow-y-auto p-0"
      >
        {/* Header Image */}
        <div className="relative aspect-video w-full">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
          />
          <div className="from-card absolute inset-0 bg-linear-to-t via-transparent to-transparent" />

          <button
            onClick={onClose}
            className="bg-background/80 text-foreground hover:bg-background absolute top-4 right-4 cursor-pointer rounded-full p-2 backdrop-blur-sm transition-colors"
            title="Close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 -mt-16 p-6">
          <DialogHeader className="text-left">
            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
                {recipe.cuisine}
              </span>
              <span className={cn("badge-difficulty", difficultyClass)}>
                {recipe.difficulty}
              </span>
            </div>

            <DialogTitle className="font-display text-foreground text-3xl font-bold">
              {recipe.title}
            </DialogTitle>

            <p className="text-muted-foreground font-body mt-2">
              {recipe.description}
            </p>
          </DialogHeader>

          {/* Meta Info */}
          <div className="border-border mt-6 flex flex-wrap gap-6 border-y py-4">
            <div className="text-foreground flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">
                  Prep: {recipe.prepTime} min
                </p>
                <p className="text-sm font-medium">
                  Cook: {recipe.cookTime} min
                </p>
              </div>
            </div>
            <div className="text-foreground flex items-center gap-2">
              <Users className="text-primary h-5 w-5" />
              <p className="text-sm font-medium">{recipe.servings} servings</p>
            </div>
          </div>

          {/* Video Source Link */}
          {recipe.videoSource && (
            <a
              href={recipe.videoSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "platform-badge mt-4 inline-flex items-center gap-2",
                platformClass,
              )}
            >
              <PlatformIcon platform={recipe.videoSource.platform} />
              <span>Watch on {recipe.videoSource.platform}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Ingredients */}
          <div className="mt-8">
            <h3 className="font-display text-foreground mb-4 text-xl font-semibold">
              Ingredients
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="text-foreground font-body flex items-center gap-2"
                >
                  <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span className="capitalize">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mt-8">
            <h3 className="font-display text-foreground mb-4 text-xl font-semibold">
              Instructions
            </h3>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="font-body flex gap-4">
                  <span className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-foreground pt-0.5">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tags */}
          <div className="border-border mt-8 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium capitalize"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
