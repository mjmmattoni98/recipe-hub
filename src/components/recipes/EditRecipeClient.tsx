"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type EditRecipeClientProps = {
  recipeId: string;
  defaultValues: RecipeFormValues;
};

export function EditRecipeClient({
  recipeId,
  defaultValues,
}: Readonly<EditRecipeClientProps>) {
  const router = useRouter();
  const utils = api.useUtils();

  const updateRecipe = api.recipe.update.useMutation({
    onSuccess: () => {
      toast.success("Recipe updated successfully");
      router.push(`/recipes/${recipeId}`);
      router.refresh();
      void utils.recipe.getById.invalidate({ id: recipeId });
      void utils.recipe.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (values: RecipeFormValues) => {
    updateRecipe.mutate({
      id: recipeId,
      ...values,
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href={`/recipes/${recipeId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Back to recipe"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <h1 className="font-display text-foreground text-xl font-bold">
            Edit Recipe
          </h1>
        </div>
      </div>

      <main
        id="main-content"
        className="container mx-auto max-w-3xl px-4 py-10"
      >
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
      </main>
    </div>
  );
}
