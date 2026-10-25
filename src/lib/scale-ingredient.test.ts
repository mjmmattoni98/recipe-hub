import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scaleIngredient } from "./scale-ingredient";

describe("scaleIngredient", () => {
  const cases: [string, number, string][] = [
    ["450g ricotta", 2, "900g ricotta"],
    ["2 carbasses mitjanes", 1.5, "3 carbasses mitjanes"],
    ["1/2 taza de leche", 2, "1 taza de leche"],
    ["1 1/2 tazas de harina", 2, "3 tazas de harina"],
    ["½ cebolla", 3, "1½ cebolla"],
    ["1½ tazas de caldo", 2, "3 tazas de caldo"],
    ["1,5 kg de patatas", 2, "3 kg de patatas"],
    ["1.5 kg de patatas", 2, "3 kg de patatas"],
    ["1.000 g de harina", 0.5, "500 g de harina"],
    ["3-4 dientes de ajo", 2, "6-8 dientes de ajo"],
    ["3 cucharadas de aceite", 1.25, "3¾ cucharadas de aceite"],
    ["1 huevo", 0.25, "¼ huevo"],
    ["100 g de queso", 1 / 3, "33 g de queso"],
    ["1 cucharadita de sal", 0.3, "⅓ cucharadita de sal"],
    ["1 cucharadita de sal", 0.1, "0,1 cucharadita de sal"],
  ];

  for (const [ingredient, factor, expected] of cases) {
    it(`scales "${ingredient}" by ${factor}`, () => {
      assert.equal(scaleIngredient(ingredient, factor), expected);
    });
  }

  it("leaves lines without a leading quantity alone", () => {
    assert.equal(scaleIngredient("base de pizza", 2), "base de pizza");
    assert.equal(
      scaleIngredient("sal y pimienta al gusto", 3),
      "sal y pimienta al gusto",
    );
  });

  it("returns the original text when the factor is 1", () => {
    assert.equal(
      scaleIngredient("1,50 kg de patatas", 1),
      "1,50 kg de patatas",
    );
  });

  it("only scales the leading quantity", () => {
    assert.equal(
      scaleIngredient("1 lata (400 g) de tomate", 2),
      "2 lata (400 g) de tomate",
    );
  });
});
