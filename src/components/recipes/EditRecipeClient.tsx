"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/trpc/react";
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
      toast.success("Receta actualizada con éxito");
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
    <main id="main-content">
      <PageHeader
        lead={
          <BackLink
            fallbackHref={`/recipes/${recipeId}`}
            label="Volver a la receta"
          />
        }
        eyebrow="Editando"
        title={defaultValues.title}
      />
      <div className="page">
        <div className="max-w-5xl">
          <RecipeForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={updateRecipe.isPending}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </main>
  );
}
