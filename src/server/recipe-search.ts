import { searchTerms, escapeLikePattern } from "@/lib/recipe-search";
import { Prisma } from "../../generated/prisma/client";

// Every term must appear, ignoring case and accents, in the title, one of
// the ingredient lines or one of the tags. Terms are matched separately, so
// "pollo patatas" can match across fields. Returns null for an empty search.
// Needs the "unaccent" extension and the Recipe table aliased as "r".
export function recipeSearchCondition(query: string) {
  const terms = searchTerms(query);
  if (terms.length === 0) return null;

  const termConditions = terms.map(
    (term) => Prisma.sql`EXISTS (
        SELECT 1
        FROM unnest(ARRAY[r."title"] || r."ingredients" || r."tags") AS search_text
        WHERE unaccent(search_text) ILIKE '%' || unaccent(${escapeLikePattern(term)}) || '%'
      )`,
  );

  return Prisma.sql`(${Prisma.join(termConditions, " AND ")})`;
}
