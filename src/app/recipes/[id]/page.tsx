import { PlatformIcon } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/server";
import { ChevronLeft, Clock, ExternalLink, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function RecipePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const recipe = await api.recipe.getById({ id });

  if (!recipe) {
    notFound();
  }

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
    <div className="bg-background min-h-screen pb-12">
      {/* Header Image */}
      <div className="relative aspect-video max-h-[60vh] w-full">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover"
          priority
        />
        <div className="from-background absolute inset-0 bg-linear-to-t via-transparent to-transparent" />

        <div className="absolute top-4 left-4 z-10">
          <Link href="/">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 hover:bg-background h-10 w-10 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10 container mx-auto -mt-20 max-w-4xl px-4">
        <div className="bg-card border-border rounded-xl border p-6 shadow-lg md:p-8">
          {/* Header Content */}
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
              {recipe.cuisine}
            </span>
            <span className={cn("badge-difficulty", difficultyClass)}>
              {recipe.difficulty}
            </span>
          </div>

          <h1 className="font-display text-foreground mb-4 text-3xl font-bold md:text-4xl">
            {recipe.title}
          </h1>

          <p className="text-muted-foreground font-body text-lg leading-relaxed">
            {recipe.description}
          </p>

          {/* Meta Info */}
          <div className="border-border mt-6 flex flex-wrap gap-6 border-y py-6">
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
                "platform-badge mt-6 inline-flex items-center gap-2",
                platformClass,
              )}
            >
              <PlatformIcon platform={recipe.videoSource.platform} />
              <span>Watch on {recipe.videoSource.platform}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Ingredients & Instructions Grid */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Ingredients */}
            <div>
              <h2 className="font-display text-foreground mb-4 text-2xl font-semibold">
                Ingredients
              </h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="text-foreground font-body hover:bg-muted/50 flex items-start gap-3 rounded-lg p-2 transition-colors"
                  >
                    <span className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="capitalize">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h2 className="font-display text-foreground mb-4 text-2xl font-semibold">
                Instructions
              </h2>
              <ol className="space-y-6">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="font-body flex gap-4">
                    <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <p className="text-foreground pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Tags */}
          <div className="border-border mt-8 border-t pt-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-semibold">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium capitalize"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
