"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type RouterOutputs } from "@/trpc/react";
import { Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type ImportedSocialRecipe = RouterOutputs["ai"]["importSocialRecipe"];

export function ImportLinkDialog({
  onApply,
}: Readonly<{
  onApply: (recipe: ImportedSocialRecipe) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const importRecipe = api.ai.importSocialRecipe.useMutation({
    onSuccess: (recipe) => {
      onApply(recipe);
      setOpen(false);
      setUrl("");
      toast.success(
        recipe.image
          ? "Receta importada. Revísala antes de guardar."
          : "Texto importado. Revísalo y añade una imagen antes de guardar.",
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const trimmed = url.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Link2 className="mr-2 h-4 w-4" />
          Importar enlace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar desde un enlace</DialogTitle>
          <DialogDescription>
            Pega un enlace de YouTube, TikTok o Instagram. Se lee el texto
            público de la publicación y se rellena la receta. Si Instagram no
            muestra el pie de foto, cópialo y usa Generar con IA.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="social-recipe-url">Enlace</Label>
          <Input
            id="social-recipe-url"
            name="url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => importRecipe.mutate({ url: trimmed })}
            disabled={importRecipe.isPending || trimmed.length < 8}
          >
            {importRecipe.isPending ? (
              <span className="animate-spin" aria-hidden="true">
                <Loader2 />
              </span>
            ) : null}
            {importRecipe.isPending ? "Importando…" : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
