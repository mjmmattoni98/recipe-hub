"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type RecipePageActionsProps = {
  recipeId: string;
};

export function RecipePageActions({
  recipeId,
}: Readonly<RecipePageActionsProps>) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteRecipe = api.recipe.delete.useMutation({
    onSuccess: async () => {
      toast.success("Receta eliminada con éxito");
      setIsDeleteDialogOpen(false);
      await utils.recipe.getAll.invalidate();
      await utils.recipe.getById.invalidate({ id: recipeId });
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex items-center gap-3">
      <Link href={`/recipes/${recipeId}/edit`}>
        <Button
          variant="secondary"
          size="icon"
          className="bg-background/80 hover:bg-background h-11 w-11 cursor-pointer rounded-full shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-105"
          aria-label="Editar receta"
        >
          <Edit className="h-5 w-5" aria-hidden="true" />
        </Button>
      </Link>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 hover:bg-background h-11 w-11 cursor-pointer rounded-full shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-105"
            aria-label="Eliminar receta"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar receta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la receta de forma permanente. No se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRecipe.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteRecipe.mutate({ id: recipeId })}
              disabled={deleteRecipe.isPending}
            >
              {deleteRecipe.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
