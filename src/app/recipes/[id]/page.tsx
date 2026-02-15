import { PlatformIcon } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/server";
import {
  ArrowLeft,
  Clock,
  Edit,
  ExternalLink,
  Flame,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
    <div className="bg-background min-h-screen pb-16">
      {/* Header Image */}
      <div className="relative aspect-video max-h-[55vh] w-full overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover"
          priority
        />
        <div className="from-background via-background/40 absolute inset-0 bg-linear-to-t to-transparent" />

        <div className="absolute top-4 right-4 left-4 z-10 flex justify-between">
          <Link href="/">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 hover:bg-background h-11 w-11 rounded-full shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {session?.user && (
            <Link href={`/recipes/${id}/edit`}>
              <Button
                variant="secondary"
                size="icon"
                className="bg-background/80 hover:bg-background h-11 w-11 rounded-full shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-105"
              >
                <Edit className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="relative z-10 container mx-auto -mt-24 max-w-4xl px-4">
        <div
          className="bg-card rounded-2xl border p-7 md:p-10"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          {/* Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
              {recipe.cuisine}
            </span>
            <span className={cn("badge-difficulty", difficultyClass)}>
              {recipe.difficulty}
            </span>
          </div>

          <h1 className="font-display text-foreground mb-4 text-3xl leading-tight font-bold md:text-5xl md:leading-tight">
            {recipe.title}
          </h1>

          <p className="text-muted-foreground font-body max-w-2xl text-lg leading-relaxed">
            {recipe.description}
          </p>

          {/* Meta Info */}
          <div className="border-border mt-8 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Prep Time
                </p>
                <p className="text-foreground font-body text-sm font-semibold">
                  {recipe.prepTime} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Flame className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Cook Time
                </p>
                <p className="text-foreground font-body text-sm font-semibold">
                  {recipe.cookTime} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Users className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Servings
                </p>
                <p className="text-foreground font-body text-sm font-semibold">
                  {recipe.servings}
                </p>
              </div>
            </div>
          </div>

          {recipe.videoSource && (
            <a
              href={recipe.videoSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "platform-badge mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-105",
                platformClass,
              )}
            >
              <PlatformIcon platform={recipe.videoSource.platform} />
              <span>Watch on {recipe.videoSource.platform}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-foreground mb-5 text-2xl font-semibold">
                Ingredients
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="font-body text-foreground hover:bg-muted/50 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                  >
                    <span className="bg-primary/20 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                    </span>
                    <span className="capitalize">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-foreground mb-5 text-2xl font-semibold">
                Instructions
              </h2>
              <ol className="space-y-5">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="font-body group flex gap-4">
                    <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md transition-transform duration-200 group-hover:scale-110">
                      {index + 1}
                    </span>
                    <p className="text-foreground pt-1 leading-relaxed">
                      {instruction}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="border-border mt-10 border-t pt-6">
              <h3 className="text-muted-foreground font-body mb-3 text-xs font-semibold tracking-wider uppercase">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground rounded-full px-3.5 py-1.5 text-xs font-medium capitalize"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
