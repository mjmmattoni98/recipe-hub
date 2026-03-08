import { PlatformIcon } from "@/components/PlatformIcon";
import { RecipePageActions } from "@/components/recipes/RecipePageActions";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { getServerSession } from "@/server/auth/session";
import { api } from "@/trpc/server";
import { ArrowLeft, Clock, ExternalLink, Flame, Users } from "lucide-react";
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

const getRecipe = cache(async (id: string) => {
  return api.recipe.getById({ id });
});

export async function generateMetadata({
  params,
}: Readonly<RecipePageProps>): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    return {
      title: "Receta No Encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: recipe.title,
    description: recipe.description,
    alternates: {
      canonical: `/recipes/${recipe.id}`,
    },
    openGraph: {
      type: "article",
      url: absoluteUrl(`/recipes/${recipe.id}`),
      title: `${recipe.title} | Recipe Hub`,
      description: recipe.description,
      images: [
        {
          url: recipe.image,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${recipe.title} | Recipe Hub`,
      description: recipe.description,
      images: [recipe.image],
    },
  };
}

export default async function RecipePage({
  params,
}: Readonly<RecipePageProps>) {
  await connection();
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  const session = await getServerSession();

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

  const difficultyLabels = {
    Easy: "Fácil",
    Medium: "Media",
    Hard: "Difícil",
  };

  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: [recipe.image],
    url: absoluteUrl(`/recipes/${recipe.id}`),
    recipeCuisine: recipe.cuisine,
    recipeCategory: difficultyLabels[recipe.difficulty],
    prepTime: `PT${recipe.prepTime}M`,
    cookTime: `PT${recipe.cookTime}M`,
    totalTime: `PT${recipe.prepTime + recipe.cookTime}M`,
    recipeYield: `${recipe.servings} raciones`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((instruction, index) => ({
      "@type": "HowToStep",
      name: `Paso ${index + 1}`,
      text: instruction,
    })),
    keywords: recipe.tags.join(", "),
  };

  return (
    <main id="main-content" className="bg-background min-h-screen pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
      />

      <div className="relative aspect-video max-h-[55vh] w-full overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="from-background via-background/40 absolute inset-0 bg-linear-to-t to-transparent" />

        <div className="absolute top-4 right-4 left-4 z-10 flex justify-between">
          <Link href="/">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 hover:bg-background h-11 w-11 cursor-pointer rounded-full shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-105"
              aria-label="Volver a las recetas"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          {session?.user ? <RecipePageActions recipeId={id} /> : null}
        </div>
      </div>

      <div className="relative z-10 container mx-auto -mt-24 max-w-4xl px-4">
        <article
          className="bg-card rounded-2xl border p-7 md:p-10"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
              {recipe.cuisine}
            </span>
            <span className={cn("badge-difficulty", difficultyClass)}>
              {difficultyLabels[recipe.difficulty]}
            </span>
          </div>

          <h1 className="font-display text-foreground mb-4 text-3xl leading-tight font-bold md:text-5xl md:leading-tight">
            {recipe.title}
          </h1>

          <p className="text-muted-foreground font-body max-w-2xl text-lg leading-relaxed">
            {recipe.description}
          </p>

          <div className="border-border mt-8 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock className="text-primary h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Tiempo Prep.
                </p>
                <p className="text-foreground font-body text-sm font-semibold">
                  {recipe.prepTime} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Flame className="text-primary h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Tiempo Cocción
                </p>
                <p className="text-foreground font-body text-sm font-semibold">
                  {recipe.cookTime} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Users className="text-primary h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Raciones
                </p>
                <p className="text-foreground font-body text-sm font-semibold">
                  {recipe.servings}
                </p>
              </div>
            </div>
          </div>

          {recipe.videoSource ? (
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
              <span>Ver en {recipe.videoSource.platform}</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}

          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <section>
              <h2 className="font-display text-foreground mb-5 text-2xl font-semibold">
                Ingredientes
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
            </section>

            <section>
              <h2 className="font-display text-foreground mb-5 text-2xl font-semibold">
                Instrucciones
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
            </section>
          </div>

          {recipe.tags.length > 0 ? (
            <section className="border-border mt-10 border-t pt-6">
              <h3 className="text-muted-foreground font-body mb-3 text-xs font-semibold tracking-wider uppercase">
                Etiquetas
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
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}
