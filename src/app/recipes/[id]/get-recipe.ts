import "server-only";

import { api } from "@/trpc/server";
import { cache } from "react";

// Shared by the segment layout, the pages and their metadata so a request
// loads the recipe once.
export const getRecipe = cache(async (id: string) => {
  return api.recipe.getById({ id });
});
