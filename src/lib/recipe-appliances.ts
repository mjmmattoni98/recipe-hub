import { z } from "zod";

export const recipeApplianceSchema = z.enum(["airfryer", "mambo"]);
export type RecipeAppliance = z.infer<typeof recipeApplianceSchema>;

export const APPLIANCE_LABELS: Record<RecipeAppliance, string> = {
  airfryer: "Airfryer",
  mambo: "Mambo",
};

export const APPLIANCE_OPTIONS = [
  { label: "Todos", value: null },
  { label: APPLIANCE_LABELS.airfryer, value: "airfryer" },
  { label: APPLIANCE_LABELS.mambo, value: "mambo" },
] satisfies { label: string; value: RecipeAppliance | null }[];
