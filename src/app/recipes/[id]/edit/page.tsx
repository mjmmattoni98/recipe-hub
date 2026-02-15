import { EditRecipeClient } from "@/components/recipes/EditRecipeClient";
import { type RecipeFormValues } from "@/components/RecipeForm";
import { absoluteUrl } from "@/lib/seo";
import { requireServerSession } from "@/server/auth/require-session";
import { api } from "@/trpc/server";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

type EditRecipePageProps = {
  params: Promise<{ id: string }>;
};

const getRecipe = cache(async (id: string) => {
  return api.recipe.getById({ id });
});

export async function generateMetadata({
  params,
}: Readonly<EditRecipePageProps>): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);

  const title = recipe ? `Edit ${recipe.title}` : "Edit Recipe";
  const description = recipe
    ? `Update details for ${recipe.title}.`
    : "Update recipe details.";

  return {
    title,
    description,
    alternates: {
      canonical: `/recipes/${id}/edit`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      url: absoluteUrl(`/recipes/${id}/edit`),
      title: `${title} | Recipe Hub`,
      description,
    },
  };
}

export default async function EditRecipePage({
  params,
}: Readonly<EditRecipePageProps>) {
  await connection();
  const { id } = await params;

  await requireServerSession(`/recipes/${id}/edit`);

  const recipe = await getRecipe(id);
  if (!recipe) {
    notFound();
  }

  const defaultValues: RecipeFormValues = {
    title: recipe.title,
    description: recipe.description,
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    cookTime: recipe.cookTime,
    prepTime: recipe.prepTime,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    image: recipe.image,
    tags: recipe.tags,
    videoSource: recipe.videoSource
      ? {
          platform: recipe.videoSource.platform,
          url: recipe.videoSource.url,
        }
      : undefined,
  };

  return <EditRecipeClient recipeId={id} defaultValues={defaultValues} />;
}
