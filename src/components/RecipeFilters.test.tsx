import assert from "node:assert/strict";
import { it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EMPTY_FILTERS } from "@/lib/recipe-filters";
import { RecipeFilters } from "./RecipeFilters";

it("renders the accessible appliance group for guests and shows the selection", () => {
  for (const appliance of [null, "airfryer", "mambo"] as const) {
    const html = renderToStaticMarkup(
      createElement(RecipeFilters, {
        filters: { ...EMPTY_FILTERS, appliance },
        onFilterChange: () => {},
        availableCuisines: [],
        availableIngredients: [],
        isLoggedIn: false,
      }),
    );
    const group = html.match(
      /role="group" aria-label="Aparato">(.*?)<\/div><\/div>/,
    )?.[1];
    assert.ok(group);
    const selectedLabel =
      appliance === null
        ? "Todos"
        : appliance === "airfryer"
          ? "Airfryer"
          : "Mambo";
    assert.match(
      group,
      new RegExp(`aria-pressed="true"[^>]*>${selectedLabel}</button>`),
    );
    assert.equal((group.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.match(group, />Airfryer<\/button>/);
    assert.match(group, />Mambo<\/button>/);
  }
});
