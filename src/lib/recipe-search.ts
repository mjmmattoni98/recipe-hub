// The search box is bounded on the way in (the input, the URL and the tRPC
// schema all use these) so one request can't build an arbitrarily big query.
export const MAX_SEARCH_LENGTH = 100;
export const MAX_SEARCH_TERMS = 8;

// Every term has to match somewhere in the recipe, so extra terms beyond the
// cap are ignored rather than rejected.
export function searchTerms(query: string) {
  return query.split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TERMS);
}

// LIKE treats % and _ as wildcards and \ as the escape character
export function escapeLikePattern(term: string) {
  return term.replace(/[\\%_]/g, "\\$&");
}
