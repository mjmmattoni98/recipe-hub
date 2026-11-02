"use client";

import { RecipeForm, type RecipeFormValues } from "@/components/RecipeForm";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <main id="main-content">
      <PageHeader
        lead={<BackLink label="Recetas" />}
        eyebrow="Recetario"
        title={
          <>
            Nueva <em className="text-primary">receta</em>
          </>
        }
        description="Apunta lo básico; lo demás se puede completar luego."
      />
      <div className="page">
        <div className="max-w-5xl">
          <RecipeForm
            onSubmit={handleSubmit}
            isSubmitting={createRecipe.isPending}
            submitLabel="Guardar receta"
          />
        </div>
      </div>
    </main>
  );
}
