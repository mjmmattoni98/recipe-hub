"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewRecipePage() {
  const router = useRouter();
  const utils = api.useUtils();
  const createRecipe = api.recipe.create.useMutation({
    onSuccess: () => {
      toast.success("Recipe created successfully");
      router.push("/");
      router.refresh();
      void utils.recipe.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (values: RecipeFormValues) => {
    createRecipe.mutate(values);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Recipe</h1>
        <p className="text-muted-foreground mt-2">
          Add a new recipe to your collection.
        </p>
      </div>

      <RecipeForm
        onSubmit={handleSubmit}
        isSubmitting={createRecipe.isPending}
        submitLabel="Create Recipe"
      />
    </div>
  );
}
