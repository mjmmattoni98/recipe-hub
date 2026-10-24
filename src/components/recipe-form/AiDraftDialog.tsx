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
import { Textarea } from "@/components/ui/textarea";
import { api, type RouterOutputs } from "@/trpc/react";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type AiRecipeDraft = RouterOutputs["ai"]["structureRecipe"];

const MIN_TEXT = 20;

export function AiDraftDialog({
  onApply,
}: Readonly<{
  onApply: (draft: AiRecipeDraft) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const structureRecipe = api.ai.structureRecipe.useMutation({
    onSuccess: (draft) => {
      onApply(draft);
      setOpen(false);
      setText("");
      toast.success(
        "Campos rellenados. Revisa la receta y añade una imagen antes de guardar.",
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const trimmed = text.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          Generar con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar receta con IA</DialogTitle>
          <DialogDescription>
            Pega el texto de una receta: un pie de foto, una nota o unos pasos
            sueltos. Se envía a OpenRouter con un modelo gratuito y solo está
            disponible con la sesión iniciada. La imagen no se genera aquí.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-48"
          maxLength={12_000}
          placeholder="Por ejemplo: Tortilla de patata. 4 huevos, 3 patatas, cebolla. Freír las patatas, mezclar con el huevo y cuajar por los dos lados."
        />
        <p className="text-muted-foreground text-xs">
          {trimmed.length}/12000
          {trimmed.length < MIN_TEXT
            ? ` · al menos ${MIN_TEXT} caracteres`
            : null}
        </p>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => structureRecipe.mutate({ text: trimmed })}
            disabled={structureRecipe.isPending || trimmed.length < MIN_TEXT}
          >
            {structureRecipe.isPending ? (
              <span className="animate-spin" aria-hidden="true">
                <Loader2 />
              </span>
            ) : null}
            {structureRecipe.isPending ? "Generando…" : "Rellenar formulario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
