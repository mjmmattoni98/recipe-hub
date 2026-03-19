"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";

export function NewRecipeClient() {
  const router = useRouter();
  const utils = api.useUtils();

  const createRecipe = api.recipe.create.useMutation({
    onSuccess: () => {
      toast.success("Receta creada con éxito");
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
          <BackButton className="bg-background/80 hover:bg-background" />
          <h1 className="font-display text-foreground text-xl font-bold">
            Crear Nueva Receta
          </h1>
        </div>
      </div>

      <main
        id="main-content"
        className="container mx-auto max-w-3xl px-4 py-10"
      >
        <div className="mb-8">
          <p className="font-body text-muted-foreground">
            Añade una nueva receta a tu colección. Rellena los detalles a
            continuación.
          </p>
        </div>

        <RecipeForm
          onSubmit={handleSubmit}
          isSubmitting={createRecipe.isPending}
          submitLabel="Crear Receta"
        />
      </main>
    </div>
  );
}
