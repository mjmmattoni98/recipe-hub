import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countActiveFilters,
  EMPTY_FILTERS,
  parseRecipeFilters,
  recipeFiltersToSearchParams,
  recipeListInput,
} from "./recipe-filters";

describe("appliance URL filters", () => {
  it("round-trips the appliance alongside the existing filters", () => {
    const filters = {
      ...EMPTY_FILTERS,
      appliance: "airfryer",
      searchQuery: "pollo",
      cuisine: ["Española"],
      maxTotalTime: 60,
    } satisfies typeof EMPTY_FILTERS;
    const params = recipeFiltersToSearchParams(filters);
    assert.equal(params.get("appliance"), "airfryer");
    assert.deepEqual(parseRecipeFilters(params, false), filters);
    assert.equal(recipeListInput(filters).appliance, "airfryer");
    assert.equal(countActiveFilters(filters), 3);
  });

  it("keeps Mambo for guests and rejects unknown apparatus values", () => {
    assert.equal(
      parseRecipeFilters(new URLSearchParams("appliance=mambo"), false)
        .appliance,
      "mambo",
    );
    for (const query of [
      "",
      "appliance=oven",
      "appliance=",
      "appliance=__proto__",
    ]) {
      assert.equal(
        parseRecipeFilters(new URLSearchParams(query), true).appliance,
        null,
      );
    }
  });

  it("removes only the appliance when cleared and omits the all option", () => {
    const selected = parseRecipeFilters(
      new URLSearchParams("appliance=mambo&q=arroz&difficulty=Easy"),
      true,
    );
    const cleared = { ...selected, appliance: null };
    const params = recipeFiltersToSearchParams(cleared);
    assert.equal(params.has("appliance"), false);
    assert.equal(params.get("q"), "arroz");
    assert.equal(params.get("difficulty"), "Easy");
    assert.equal(recipeListInput(EMPTY_FILTERS).appliance, undefined);
    assert.equal(countActiveFilters(EMPTY_FILTERS), 0);
  });
});
