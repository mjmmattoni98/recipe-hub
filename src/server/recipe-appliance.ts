import type { RecipeAppliance } from "@/lib/recipe-appliances";
import { Prisma } from "../../generated/prisma/client";

// Match whole appliance names, including older Spanish and spaced spellings.
// Keep fields separate so a match cannot be assembled across tags or steps.
const APPLIANCE_PATTERNS: Record<RecipeAppliance, string> = {
  airfryer:
    "\\m(air[[:space:]-]*fryer|freidora(s)?[[:space:]]+de[[:space:]]+aire|freidora(s)?[[:space:]]+sin[[:space:]]+aceite|cecofry)\\M",
  mambo: "\\mmambo\\M",
};

export function recipeApplianceCondition(appliance: RecipeAppliance) {
  const pattern = APPLIANCE_PATTERNS[appliance];
  return Prisma.sql`EXISTS (
    SELECT 1
    FROM unnest(ARRAY[r."title"] || r."tags" || r."instructions") AS appliance_text
    WHERE appliance_text ~* ${pattern}
  )`;
}
