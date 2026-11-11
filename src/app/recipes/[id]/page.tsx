import { BackLink } from "@/components/BackLink";
import { PlatformIcon } from "@/components/PlatformIcon";
import { CommentsSection } from "@/components/recipes/CommentsSection";
import { CookingTools } from "@/components/recipes/CookingTools";
import { DifficultyMeter } from "@/components/recipes/DifficultyMeter";
import { RecipeAssistant } from "@/components/recipes/RecipeAssistant";
import { RecipeIngredients } from "@/components/recipes/RecipeIngredients";
import { RecipePageActions } from "@/components/recipes/RecipePageActions";
import { RecipeSteps } from "@/components/recipes/RecipeSteps";
import { DIFFICULTY_LABELS } from "@/lib/recipe-types";
import { absoluteUrl } from "@/lib/seo";
import { getServerSession } from "@/server/auth/session";
import { ArrowUpRight } from "lucide-react";
import { type Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getRecipe } from "./get-recipe";
import { connection } from "next/server";

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

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
  const [recipe, session] = await Promise.all([
    getRecipe(id),
    getServerSession(),
  ]);

  if (!recipe) {
    notFound();
  }

  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: [recipe.image],
    url: absoluteUrl(`/recipes/${recipe.id}`),
    recipeCuisine: recipe.cuisine,
    recipeCategory: DIFFICULTY_LABELS[recipe.difficulty],
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

  const isLoggedIn = Boolean(session?.user);
  const stats = [
    { label: "Preparación", value: recipe.prepTime, unit: "min" },
    { label: "Cocción", value: recipe.cookTime, unit: "min" },
    { label: "Total", value: recipe.prepTime + recipe.cookTime, unit: "min" },
    {
      label: "Raciones",
      value: recipe.servings,
      unit: recipe.servings === 1 ? "ración" : "rac.",
    },
  ];

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
      />

      <div className="page flex min-h-9 items-center justify-between gap-4 pt-6 md:pt-8">
        <BackLink label="Recetas" />
        {isLoggedIn ? (
          <RecipePageActions recipeId={id} canDelete={recipe.canDelete} />
        ) : null}
      </div>

      <header className="page mt-6 grid gap-8 md:mt-8 lg:grid-cols-12 lg:items-end lg:gap-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{recipe.cuisine}</span>
            <span aria-hidden="true">·</span>
            <DifficultyMeter difficulty={recipe.difficulty} />
          </p>
          <h1 className="font-display text-foreground mt-4 text-5xl leading-[0.92] tracking-tight text-balance md:text-7xl xl:text-[5.5rem]">
            {recipe.title}
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg text-pretty md:text-xl">
            {recipe.description}
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-y-5 border-y py-5 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="eyebrow text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-foreground text-4xl leading-none tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {stat.unit}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <CookingTools
              recipeId={recipe.id}
              isLoggedIn={isLoggedIn}
              initialCooked={recipe.cookedByMe}
            />
            {recipe.videoSource ? (
              <a
                href={recipe.videoSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground decoration-primary/50 inline-flex items-center gap-2 text-sm font-medium underline decoration-1 underline-offset-4 hover:decoration-current"
              >
                <PlatformIcon platform={recipe.videoSource.platform} />
                Ver el vídeo en {recipe.videoSource.platform}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="bg-muted relative -order-1 aspect-4/3 overflow-hidden rounded-md lg:order-none lg:col-span-5 lg:aspect-4/5">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            preload
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </div>
      </header>

      <div className="page mt-16 grid gap-12 md:mt-20 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <RecipeIngredients
              ingredients={recipe.ingredients}
              servings={recipe.servings}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-16 lg:col-span-8 lg:pl-6">
          <RecipeSteps instructions={recipe.instructions} />

          {isLoggedIn ? <RecipeAssistant recipeId={recipe.id} /> : null}

          {recipe.tags.length > 0 ? (
            <section aria-labelledby="tags-heading">
              <h2
                id="tags-heading"
                className="eyebrow text-muted-foreground mb-3"
              >
                Etiquetas
              </h2>
              <ul className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <li
                    key={tag}
                    className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 font-mono text-xs"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <CommentsSection
            recipeId={recipe.id}
            isLoggedIn={isLoggedIn}
            currentUserId={session?.user.id}
          />
        </div>
      </div>
    </main>
  );
}
