"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";

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
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="bg-muted mx-auto mb-4 h-10 w-10 animate-pulse rounded-full" />
          <p className="font-body text-muted-foreground text-sm">
            Loading recipe...
          </p>
        </div>
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
    <div className="bg-background min-h-screen">
      <div className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href={`/recipes/${id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-foreground text-xl font-bold">
            Edit Recipe
          </h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <p className="font-body text-muted-foreground">
            Update the details for your recipe.
          </p>
        </div>

        <RecipeForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={updateRecipe.isPending}
          submitLabel="Update Recipe"
        />
      </div>
    </div>
  );
}
