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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { upload } from "@vercel/blob/client";
import { Copy, Plus, Trash2, Wand2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

type VideoPlatform = "YouTube" | "Instagram" | "TikTok";

const toSafeFilename = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9.-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

export const recipeFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  cuisine: z.string().min(1, "El tipo de cocina es obligatorio"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  cookTime: z.number().min(0),
  prepTime: z.number().min(0),
  servings: z.number().min(1),
  ingredients: z
    .array(z.string())
    .min(1, "Se requiere al menos un ingrediente"),
  instructions: z
    .array(z.string())
    .min(1, "Se requiere al menos una instrucción"),
  image: z.string().min(1, "La imagen es obligatoria"),
  tags: z.array(z.string()),
  videoSource: z
    .object({
      platform: z.enum(["YouTube", "Instagram", "TikTok"]),
      url: z.url("Debe ser una URL válida"),
    })
    .optional(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
  defaultValues?: RecipeFormValues;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Save Recipe",
}: Readonly<RecipeFormProps>) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const form = useForm({
    defaultValues:
      defaultValues ??
      ({
        title: "",
        description: "",
        cuisine: "",
        difficulty: "Medium",
        cookTime: 0,
        prepTime: 0,
        servings: 1,
        ingredients: [""] as string[],
        instructions: [""] as string[],
        image: "",
        tags: [] as string[],
      } as RecipeFormValues),
    validators: {
      onSubmit: recipeFormSchema,
    },
    onSubmit: async ({ value }) => {
      const buildBlobPathFromFile = (file: File) => {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const baseName = file.name.replace(/\.[^/.]+$/, "") || "recipe-image";
        const safeName = toSafeFilename(baseName) || "recipe-image";
        return `recipes/${safeName}-${Date.now()}.${extension}`;
      };

      const uploadImageToBlob = async (file: File) => {
        const blob = await upload(buildBlobPathFromFile(file), file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          multipart: file.size >= 5 * 1024 * 1024,
        });

        if (!blob.url) {
          throw new Error(
            "La respuesta de subida no incluyó la URL de la imagen",
          );
        }

        return blob.url;
      };

      const cleanedValue = {
        ...value,
        ingredients: value.ingredients.filter((i) => i.trim() !== ""),
        instructions: value.instructions.filter((i) => i.trim() !== ""),
        tags: value.tags.filter((t) => t.trim() !== ""),
      };

      let image = cleanedValue.image;

      if (imageFile) {
        setIsUploadingImage(true);
        try {
          image = await uploadImageToBlob(imageFile);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error al subir la imagen";
          toast.error(message);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      if (!image) {
        toast.error("Por favor, sube una imagen");
        return;
      }

      await onSubmit({
        ...cleanedValue,
        image,
      });
    },
  });

  const [jsonInput, setJsonInput] = useState("");
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

  let submitButtonLabel = submitLabel;
  if (isUploadingImage) {
    submitButtonLabel = "Subiendo imagen…";
  } else if (isSubmitting) {
    submitButtonLabel = "Guardando…";
  }

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      let videoSource = parsed.videoSource;
      if (videoSource?.create) {
        videoSource = videoSource.create;
      }

      form.setFieldValue("title", parsed.title || "");
      form.setFieldValue("description", parsed.description || "");
      form.setFieldValue("cuisine", parsed.cuisine || "");
      form.setFieldValue("difficulty", parsed.difficulty || "Medium");
      form.setFieldValue("cookTime", parsed.cookTime || 0);
      form.setFieldValue("prepTime", parsed.prepTime || 0);
      form.setFieldValue("servings", parsed.servings || 2);
      form.setFieldValue("ingredients", parsed.ingredients || [""]);
      form.setFieldValue("instructions", parsed.instructions || [""]);
      form.setFieldValue("image", parsed.image || "");
      form.setFieldValue("tags", parsed.tags || []);
      if (videoSource) {
        form.setFieldValue("videoSource", {
          platform: videoSource.platform,
          url: videoSource.url,
        });
      } else {
        form.setFieldValue("videoSource", undefined);
      }

      setIsJsonDialogOpen(false);
      setJsonInput("");
      toast.success("Datos de la receta importados con éxito");
    } catch {
      toast.error("Formato JSON inválido");
    }
  };

  const copyPrompt = () => {
    const prompt = `Eres un asistente experto en extracción de datos. Tu tarea es transformar el texto sin formato de una receta (normalmente de subtítulos de redes sociales como Instagram o TikTok) en un objeto JSON estructurado.

**Datos de Entrada:**
Recibirás:

1. La Plataforma y URL del vídeo.
2. La descripción del texto sin formato de la receta (ingredientes, pasos, etc.).

**Reglas de Salida:**

1. **Formato:** Devuelve **solo** el objeto JSON sin procesar. No lo envuelvas en bloques de código markdown si es posible, y no añadas texto conversacional.
2. **Idioma:**
* **Claves JSON:** Inglés.
* **Valores de contenido** (Título, Descripción, Ingredientes, Instrucciones, Cocina): **Español**.
* **Etiquetas y Dificultad:** **Inglés** (Easy, Medium, Hard).


3. **Detalles del Campo:**
*
*
*
*


**Plantilla de Estructura JSON:**


`;
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copiado al portapapeles");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyPrompt}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Prompt de IA
          </Button>
          <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                Importar JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importar JSON de Receta</DialogTitle>
                <DialogDescription>
                  Pega el JSON generado por el asistente de IA a continuación.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-75 font-mono text-xs"
                placeholder='{ "title": "..." }'
              />
              <DialogFooter>
                <Button onClick={handleImportJson}>Importar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <form.Field name="title">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Título</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Título de la receta"
              />
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Descripción</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Descripción de la receta..."
              />
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field name="cuisine">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Cocina</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="ej. Italiana"
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="difficulty">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Dificultad</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val: "Easy" | "Medium" | "Hard") =>
                    field.handleChange(val)
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Selecciona la dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Fácil</SelectItem>
                    <SelectItem value="Medium">Media</SelectItem>
                    <SelectItem value="Hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <form.Field name="prepTime">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tiempo Prep. (min)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={0}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>
          <form.Field name="cookTime">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tiempo Cocción (min)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={0}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>
          <form.Field name="servings">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Raciones</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={1}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="ingredients" mode="array">
          {(field) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Ingredientes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue("")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Añadir Ingrediente
                </Button>
              </div>
              {field.state.value.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <form.Field name={`ingredients[${index}]`}>
                    {(subField) => (
                      <Input
                        value={subField.state.value}
                        onBlur={subField.handleBlur}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        placeholder={`Ingrediente ${index + 1}`}
                      />
                    )}
                  </form.Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(index)}
                    disabled={field.state.value.length === 1}
                    aria-label={`Eliminar ingrediente ${index + 1}`}
                  >
                    <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="instructions" mode="array">
          {(field) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Instrucciones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue("")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Añadir Paso
                </Button>
              </div>
              {field.state.value.map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-2 w-6 text-sm font-medium">
                    {index + 1}.
                  </span>
                  <form.Field name={`instructions[${index}]`}>
                    {(subField) => (
                      <Textarea
                        value={subField.state.value}
                        onBlur={subField.handleBlur}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        placeholder={`Paso ${index + 1}`}
                        className="min-h-20"
                      />
                    )}
                  </form.Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(index)}
                    disabled={field.state.value.length === 1}
                    aria-label={`Eliminar paso ${index + 1}`}
                  >
                    <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="tags" mode="array">
          {(field) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Etiquetas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue("")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Añadir Etiqueta
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {field.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 flex items-center gap-2 rounded-md p-1"
                  >
                    <form.Field name={`tags[${index}]`}>
                      {(subField) => (
                        <Input
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                          placeholder="Etiqueta"
                          className="h-8 w-32 border-none bg-transparent px-2 shadow-none focus-visible:ring-0"
                        />
                      )}
                    </form.Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => field.removeValue(index)}
                      className="h-6 w-6"
                      aria-label={`Eliminar etiqueta ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="image">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="recipe-image-upload">Imagen de la Receta</Label>
              <Input
                id="recipe-image-upload"
                name="recipe-image-upload"
                type="file"
                accept="image/*"
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] ?? null;
                  setImageFile(selectedFile);

                  if (selectedFile) {
                    field.handleChange(selectedFile.name);
                    return;
                  }

                  field.handleChange(defaultValues?.image ?? "");
                }}
              />
              <p className="text-muted-foreground text-xs">
                La imagen se comprime automáticamente después de subirse.
              </p>
              {field.state.value ? (
                <p className="text-muted-foreground text-xs">
                  {imageFile
                    ? `Archivo seleccionado: ${imageFile.name}`
                    : "La imagen actual ya está guardada para esta receta."}
                </p>
              ) : null}
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        {/* Video Source */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Origen del Vídeo (Opcional)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <form.Field name="videoSource.platform">
              {(field) => (
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: VideoPlatform) => {
                      field.handleChange(val);
                      // If platform is selected, ensure we initialize the object if it was undefined
                      if (!form.getFieldValue("videoSource")) {
                        form.setFieldValue("videoSource", {
                          platform: val,
                          url: "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            <form.Field name="videoSource.url">
              {(field) => (
                <div className="space-y-2 md:col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={field.state.value || ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      const currentPlatform = form.getFieldValue(
                        "videoSource.platform",
                      );
                      if (!form.getFieldValue("videoSource")) {
                        form.setFieldValue("videoSource", {
                          platform: currentPlatform || "Instagram",
                          url: e.target.value,
                        });
                      }
                    }}
                    placeholder="https://..."
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || isUploadingImage}
          >
            {submitButtonLabel}
          </Button>
        </div>
      </form>

      <div className="bg-muted/50 mt-12 rounded-lg border p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Wand2 className="h-5 w-5" />
          ¿Cómo generar una imagen?
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Puedes usar el JSON para pedirle a una IA que genere una imagen. Usa
          un prompt como:
        </p>
        <div className="bg-background group relative rounded-md border p-4 font-mono text-sm">
          "Genera una imagen de fotografía gastronómica fotorrealista para una
          receta con este título: [Título] y descripción: [Descripción]. Vista
          desde arriba, alta calidad."
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Copiar prompt de generación de imagen"
            onClick={() => {
              navigator.clipboard.writeText(
                "Genera una imagen de fotografía gastronómica fotorrealista para una receta con este título: [Título] y descripción: [Descripción]. Vista desde arriba, alta calidad.",
              );
              toast.success("Prompt de imagen copiado");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
