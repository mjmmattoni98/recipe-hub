"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { api } from "@/trpc/react";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import { use } from "react";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const utils = api.useUtils();

  const { data: recipe, isLoading } = api.recipe.getById.useQuery({ id });

  const updateRecipe = api.recipe.update.useMutation({
    onSuccess: () => {
      toast.success("Recipe updated successfully");
      router.push(`/recipes/${id}`);
      router.refresh();
      void utils.recipe.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10 text-center">
        Loading...
      </div>
    );
  }

  if (!recipe) {
    notFound();
  }

  const handleSubmit = async (values: RecipeFormValues) => {
    updateRecipe.mutate({
      id,
      ...values,
    });
  };

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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Recipe</h1>
        <p className="text-muted-foreground mt-2">Update your recipe details.</p>
      </div>

      <RecipeForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateRecipe.isPending}
        submitLabel="Update Recipe"
      />
    </div>
  );
}
