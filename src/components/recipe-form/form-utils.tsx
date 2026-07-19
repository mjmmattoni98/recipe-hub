import type { ReactFormExtendedApi } from "@tanstack/react-form";
import * as z from "zod";

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

// The form instance is shared between RecipeForm and its extracted field
// sections. Typing every validator generic here would require repeating
// `ReactFormExtendedApi`'s 11-parameter validator signature at each call
// site, so we widen those to `any` (per TanStack Form's own guidance for
// this case) while keeping `RecipeFormValues` so field names stay checked.
export type RecipeFormApi = ReactFormExtendedApi<
  RecipeFormValues,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

const getFormErrorMessage = (error: unknown): string | null => {
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return null;
};

const formatFieldErrors = (errors: unknown[] | undefined): string | null => {
  if (!errors?.length) {
    return null;
  }

  const messages = errors.map(getFormErrorMessage).filter(Boolean);

  if (!messages.length) {
    return null;
  }

  return [...new Set(messages)].join(", ");
};

export const renderFieldErrors = (errors: unknown[] | undefined) => {
  const errorMessage = formatFieldErrors(errors);

  if (!errorMessage) {
    return null;
  }

  return <p className="text-destructive text-sm">{errorMessage}</p>;
};
