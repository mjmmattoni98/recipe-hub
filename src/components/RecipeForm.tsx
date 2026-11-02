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
import { Braces, Copy, ImageUp, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AiDraftDialog } from "@/components/recipe-form/AiDraftDialog";
import { ImportLinkDialog } from "@/components/recipe-form/ImportLinkDialog";
import { IngredientsField } from "@/components/recipe-form/IngredientsField";
import { InstructionsField } from "@/components/recipe-form/InstructionsField";
import { VideoSourceField } from "@/components/recipe-form/VideoSourceField";
import {
  recipeFormSchema,
  renderFieldErrors,
  type RecipeFormValues,
} from "@/components/recipe-form/form-utils";

export { recipeFormSchema, type RecipeFormValues };

function FormSection({
  number,
  title,
  description,
  children,
}: Readonly<{
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}>) {
  return (
    <section className="grid gap-6 border-t py-10 md:grid-cols-[13rem_1fr] md:gap-10">
      <div>
        <p className="eyebrow text-primary">{number}</p>
        <h2 className="font-display mt-1 text-3xl tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 space-y-6">{children}</div>
    </section>
  );
}

const toSafeFilename = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9.-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

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
  submitLabel = "Guardar receta",
}: Readonly<RecipeFormProps>) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    defaultValues?.image ?? null,
  );
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(
    defaultValues?.image ?? null,
  );

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(savedImageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, savedImageUrl]);

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

  const imageGenerationPrompt =
    "Genera una imagen de fotografía gastronómica fotorrealista para una receta con este título: [Título] y descripción: [Descripción]. Vista desde arriba, alta calidad.";

  const copyImagePrompt = () => {
    navigator.clipboard.writeText(imageGenerationPrompt);
    toast.success("Prompt de imagen copiado");
  };

  return (
    <div>
      <div className="bg-card rounded-lg border p-5 md:p-6">
        <p className="eyebrow text-muted-foreground">Atajo</p>
        <p className="font-display mt-1 text-2xl tracking-tight">
          ¿La tienes en otro sitio? Rellena el formulario de golpe.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AiDraftDialog
            onApply={(draft) => {
              form.setFieldValue("title", draft.title);
              form.setFieldValue("description", draft.description);
              form.setFieldValue("cuisine", draft.cuisine);
              form.setFieldValue("difficulty", draft.difficulty);
              form.setFieldValue("cookTime", draft.cookTime);
              form.setFieldValue("prepTime", draft.prepTime);
              form.setFieldValue("servings", draft.servings);
              form.setFieldValue("ingredients", draft.ingredients);
              form.setFieldValue("instructions", draft.instructions);
              form.setFieldValue("tags", draft.tags);
            }}
          />
          <ImportLinkDialog
            onApply={(recipe) => {
              form.setFieldValue("title", recipe.title);
              form.setFieldValue("description", recipe.description);
              form.setFieldValue("cuisine", recipe.cuisine);
              form.setFieldValue("difficulty", recipe.difficulty);
              form.setFieldValue("cookTime", recipe.cookTime);
              form.setFieldValue("prepTime", recipe.prepTime);
              form.setFieldValue("servings", recipe.servings);
              form.setFieldValue("ingredients", recipe.ingredients);
              form.setFieldValue("instructions", recipe.instructions);
              form.setFieldValue("tags", recipe.tags);
              form.setFieldValue("videoSource", recipe.videoSource);
              if (recipe.image) {
                setImageFile(null);
                if (imageInputRef.current) {
                  imageInputRef.current.value = "";
                }
                setSavedImageUrl(recipe.image);
                form.setFieldValue("image", recipe.image);
              }
            }}
          />
          <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Braces aria-hidden="true" />
                Importar JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl font-normal tracking-tight">
                  Importar JSON de receta
                </DialogTitle>
                <DialogDescription>
                  Pega un JSON de receta si ya lo tienes de otro asistente.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-75 font-mono text-xs"
                placeholder='{ "title": "..." }'
                aria-label="JSON de la receta"
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
        className="mt-10"
      >
        <FormSection
          number="01"
          title="Lo básico"
          description="Cómo se llama y qué la hace especial."
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
                {renderFieldErrors(field.state.meta.errors)}
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
                {renderFieldErrors(field.state.meta.errors)}
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  {renderFieldErrors(field.state.meta.errors)}
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
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Selecciona la dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Fácil</SelectItem>
                      <SelectItem value="Medium">Media</SelectItem>
                      <SelectItem value="Hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderFieldErrors(field.state.meta.errors)}
                </div>
              )}
            </form.Field>
          </div>
        </FormSection>

        <FormSection
          number="02"
          title="Tiempos"
          description="En minutos. El total se calcula solo."
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                  {renderFieldErrors(field.state.meta.errors)}
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
                  {renderFieldErrors(field.state.meta.errors)}
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
                  {renderFieldErrors(field.state.meta.errors)}
                </div>
              )}
            </form.Field>
          </div>
        </FormSection>

        <FormSection
          number="03"
          title="Ingredientes"
          description="Uno por línea, con su cantidad: así se pueden escalar las raciones."
        >
          <IngredientsField form={form} />
        </FormSection>

        <FormSection
          number="04"
          title="Preparación"
          description="Un paso por bloque, en el orden en que se hacen."
        >
          <InstructionsField form={form} />
        </FormSection>

        <FormSection number="05" title="Foto">
          <form.Field name="image">
            {(field) => (
              <div className="space-y-2">
                {imagePreviewUrl ? (
                  <Image
                    src={imagePreviewUrl}
                    alt="Vista previa de la foto de la receta"
                    width={896}
                    height={672}
                    unoptimized
                    className="aspect-4/3 w-full rounded-md border object-cover"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed">
                    <ImageUp className="size-6" aria-hidden="true" />
                    <span className="text-sm">Todavía sin foto</span>
                  </div>
                )}
                <Label htmlFor="recipe-image-upload">
                  {imagePreviewUrl ? "Cambiar foto" : "Subir foto"}
                </Label>
                <Input
                  id="recipe-image-upload"
                  name="recipe-image-upload"
                  type="file"
                  accept="image/*"
                  className="file:bg-secondary file:text-foreground h-11 cursor-pointer py-1.5 file:mr-3 file:h-full file:cursor-pointer file:rounded file:px-3"
                  ref={imageInputRef}
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
                  Se comprime automáticamente al subirla.
                </p>
                {imageFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageFile(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = "";
                      }
                      const restoredImage = defaultValues?.image ?? "";
                      setSavedImageUrl(restoredImage || null);
                      field.handleChange(restoredImage);
                    }}
                  >
                    Quitar imagen seleccionada
                  </Button>
                ) : null}
                {field.state.value ? (
                  <p className="text-muted-foreground text-xs">
                    {imageFile
                      ? `Archivo seleccionado: ${imageFile.name}`
                      : "La imagen actual ya está guardada para esta receta."}
                  </p>
                ) : null}
                {renderFieldErrors(field.state.meta.errors)}
              </div>
            )}
          </form.Field>

          <button
            type="button"
            className="bg-muted/50 group hover:bg-muted focus-visible:ring-ring/50 relative block w-full cursor-pointer rounded-md border p-4 text-left text-sm transition-colors outline-none focus-visible:ring-[3px]"
            aria-label="Copiar prompt de generación de imagen"
            onClick={copyImagePrompt}
          >
            <span className="eyebrow text-muted-foreground flex items-center gap-2">
              ¿Sin foto? Copia este prompt para una IA
              <Copy className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-foreground/80 mt-2 block font-mono text-xs leading-relaxed">
              {imageGenerationPrompt}
            </span>
          </button>
        </FormSection>

        <FormSection
          number="06"
          title="Extras"
          description="Opcional: el vídeo original y etiquetas para encontrarla."
        >
          <VideoSourceField form={form} />
          <form.Field name="tags" mode="array">
            {(field) => (
              <div className="space-y-3">
                <p className="text-sm font-medium">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {field.state.value.map((_, index) => (
                    <div
                      key={index}
                      className="bg-card border-input flex h-9 items-center gap-1 rounded-full border pr-1 pl-3"
                    >
                      <form.Field name={`tags[${index}]`}>
                        {(subField) => (
                          <Input
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                            placeholder="etiqueta"
                            aria-label={`Etiqueta ${index + 1}`}
                            className="h-7 w-28 rounded-none border-none bg-transparent px-0 font-mono text-xs focus-visible:ring-0 dark:bg-transparent"
                          />
                        )}
                      </form.Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => field.removeValue(index)}
                        className="size-6 rounded-full"
                        aria-label={`Eliminar etiqueta ${index + 1}`}
                      >
                        <X className="size-3" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => field.pushValue("")}
                    className="border-input text-muted-foreground hover:text-foreground hover:border-foreground/40 h-9 cursor-pointer rounded-full border border-dashed px-3 text-sm transition-colors"
                  >
                    + Etiqueta
                  </button>
                </div>
                {renderFieldErrors(field.state.meta.errors)}
              </div>
            )}
          </form.Field>
        </FormSection>

        <div className="bg-background/90 supports-backdrop-filter:bg-background/75 sticky bottom-16 z-30 -mx-4 flex items-center justify-end gap-3 border-t px-4 py-4 backdrop-blur-lg sm:-mx-6 sm:px-6 md:bottom-0">
          <form.Subscribe selector={(state) => state.values}>
            {(values) => {
              const hasFormErrors = !recipeFormSchema.safeParse(values).success;

              return (
                <Button
                  type="submit"
                  size="lg"
                  disabled={hasFormErrors || isSubmitting || isUploadingImage}
                >
                  {submitButtonLabel}
                </Button>
              );
            }}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
