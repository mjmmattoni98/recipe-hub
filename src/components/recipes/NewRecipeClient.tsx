"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NewRecipeClient() {
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
    <div className="bg-background min-h-screen">
      <div className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Back to recipes"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <h1 className="font-display text-foreground text-xl font-bold">
            Create New Recipe
          </h1>
        </div>
      </div>

      <main
        id="main-content"
        className="container mx-auto max-w-3xl px-4 py-10"
      >
        <div className="mb-8">
          <p className="font-body text-muted-foreground">
            Add a new recipe to your collection. Fill in the details below.
          </p>
        </div>

        <RecipeForm
          onSubmit={handleSubmit}
          isSubmitting={createRecipe.isPending}
          submitLabel="Create Recipe"
        />
      </main>
    </div>
  );
}
