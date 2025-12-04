import { X, Clock, Users, ExternalLink } from "lucide-react";
import type { Recipe } from "@/types/recipe";
import { PlatformIcon } from "./PlatformIcon";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  if (!recipe) return null;

  const difficultyClass = {
    Easy: "badge-easy",
    Medium: "badge-medium",
    Hard: "badge-hard",
  }[recipe.difficulty];

  const platformClass = {
    YouTube: "platform-youtube",
    Instagram: "platform-instagram",
    TikTok: "platform-tiktok",
  }[recipe.videoSource.platform];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-card border-border">
        {/* Header Image */}
        <div className="relative aspect-video w-full">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 -mt-16 relative z-10">
          <DialogHeader className="text-left">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                {recipe.cuisine}
              </span>
              <span className={cn("badge-difficulty", difficultyClass)}>
                {recipe.difficulty}
              </span>
            </div>

            <DialogTitle className="font-display text-3xl font-bold text-foreground">
              {recipe.title}
            </DialogTitle>

            <p className="text-muted-foreground mt-2 font-body">
              {recipe.description}
            </p>
          </DialogHeader>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 mt-6 py-4 border-y border-border">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Prep: {recipe.prepTime} min</p>
                <p className="text-sm font-medium">Cook: {recipe.cookTime} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{recipe.servings} servings</p>
            </div>
          </div>

          {/* Video Source Link */}
          <a
            href={recipe.videoSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("platform-badge inline-flex items-center gap-2 mt-4", platformClass)}
          >
            <PlatformIcon platform={recipe.videoSource.platform} />
            <span>Watch on {recipe.videoSource.platform}</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Ingredients */}
          <div className="mt-8">
            <h3 className="font-display text-xl font-semibold text-foreground mb-4">
              Ingredients
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-foreground font-body"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="capitalize">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mt-8">
            <h3 className="font-display text-xl font-semibold text-foreground mb-4">
              Instructions
            </h3>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4 font-body">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-foreground pt-0.5">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tags */}
          <div className="mt-8 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground capitalize"
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
