import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseRecipeDraft } from "./parse-recipe-draft";
import { consumeAiRateLimit, resetAiRateLimits } from "./rate-limit";

describe("parseRecipeDraft", () => {
  it("reads a fenced recipe and normalizes dietary tags", () => {
    const draft = parseRecipeDraft(`Aquí tienes la receta:
\`\`\`json
{
  "title": "Tortilla de patata",
  "description": "Una tortilla clásica con patata y cebolla.",
  "cuisine": "Española",
  "difficulty": "fácil",
  "cookTime": "25",
  "prepTime": 15,
  "servings": "4",
  "ingredients": ["4 huevos", "3 patatas"],
  "instructions": ["Freír las patatas", "Cuajar la tortilla"],
  "tags": ["Vegetariana", "#Sin gluten", "comfort food"]
}
\`\`\``);

    assert.equal(draft.difficulty, "Easy");
    assert.equal(draft.cookTime, 25);
    assert.equal(draft.servings, 4);
    assert.deepEqual(draft.tags, ["vegetarian", "gluten-free", "comfort food"]);
  });

  it("ignores model thinking and surrounding prose", () => {
    const draft =
      parseRecipeDraft(`<think>voy a inventar ingredientes extra</think>
Listo: {"title":"Sopa de ajo","description":"Sopa caliente de ajo y pan.","cuisine":"Española","difficulty":"Hard","cookTime":20,"prepTime":10,"servings":2,"ingredients":["ajo","pan"],"instructions":["Hervir el caldo"],"tags":[]}
¿Quieres algo más?`);

    assert.equal(draft.title, "Sopa de ajo");
    assert.equal(draft.difficulty, "Hard");
    assert.deepEqual(draft.ingredients, ["ajo", "pan"]);
  });

  it("rejects a response without ingredients", () => {
    assert.throws(
      () =>
        parseRecipeDraft(
          '{"title":"Sin cuerpo","description":"No hay ingredientes.","cuisine":"Otra","difficulty":"Medium","cookTime":1,"prepTime":1,"servings":1,"ingredients":[],"instructions":["Mezclar"],"tags":[]}',
        ),
      /receta completa/,
    );
  });
});

describe("consumeAiRateLimit", () => {
  it("limits one person to 12 requests an hour", () => {
    resetAiRateLimits();
    const now = Date.UTC(2026, 9, 23, 12, 0, 0);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      consumeAiRateLimit("ada", now);
    }

    assert.throws(
      () => consumeAiRateLimit("ada", now),
      /límite de peticiones de IA/,
    );
  });

  it("limits the whole app to 18 requests a minute", () => {
    resetAiRateLimits();
    const now = Date.UTC(2026, 9, 23, 12, 0, 0);

    for (let attempt = 0; attempt < 18; attempt += 1) {
      consumeAiRateLimit(`user-${attempt}`, now);
    }

    assert.throws(
      () => consumeAiRateLimit("user-extra", now),
      /demasiadas peticiones/,
    );
  });

  it("limits the whole app to 40 requests a day", () => {
    resetAiRateLimits();
    const start = Date.UTC(2026, 9, 23, 8, 0, 0);

    for (let attempt = 0; attempt < 40; attempt += 1) {
      consumeAiRateLimit(
        `user-${attempt % 8}`,
        start + attempt * 3 * 60 * 1000,
      );
    }

    assert.throws(
      () => consumeAiRateLimit("user-0", start + 40 * 3 * 60 * 1000),
      /límite diario/,
    );
  });
});
