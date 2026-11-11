import assert from "node:assert/strict";
import { it } from "node:test";

import {
  callersFor,
  createRecipe,
  createUser,
  describeDatabase,
  withRollback,
  type TestDb,
} from "./test-db";

// Every query carries this word, so rows already in the database can never
// show up in (or hide) the results.
const MARK = "qzxmark";

describeDatabase("recipe search in PostgreSQL", () => {
  async function search(tx: TestDb, searchQuery: string) {
    const user = await createUser(tx);
    const { recipe } = await callersFor(tx, user);
    const result = await recipe.getAll({ searchQuery, limit: 50 });
    return new Set(result.items.map((item) => item.id));
  }

  it("ignores case and accents in both the text and the query", async () => {
    await withRollback(async (tx) => {
      const accented = await createRecipe(tx, {
        title: `Salmón al limón ${MARK}`,
      });
      const plain = await createRecipe(tx, { title: `Salmon plancha ${MARK}` });
      const spanish = await createRecipe(tx, {
        title: `Pavo de España ${MARK}`,
      });

      for (const query of ["salmon", "SALMÓN", "Salmón", "limon", "LIMÓN"]) {
        const ids = await search(tx, `${query} ${MARK}`);
        assert.ok(ids.has(accented.id), query);
      }
      const ids = await search(tx, `salmón ${MARK}`);
      assert.ok(ids.has(plain.id));
      assert.ok(!ids.has(spanish.id));

      assert.ok((await search(tx, `espana ${MARK}`)).has(spanish.id));
      assert.ok((await search(tx, `ESPAÑA ${MARK}`)).has(spanish.id));
    });
  });

  it("matches ingredient lines and tags, not only the title", async () => {
    await withRollback(async (tx) => {
      const byIngredient = await createRecipe(tx, {
        title: `Potaje ${MARK}`,
        ingredients: ["500 g de garbanzos cocidos", "Sal y pimienta al gusto"],
      });
      const byTag = await createRecipe(tx, {
        title: `Bowl ${MARK}`,
        tags: ["Sin Gluten"],
      });

      const garbanzos = await search(tx, `garbanzos ${MARK}`);
      assert.ok(garbanzos.has(byIngredient.id));
      assert.ok(!garbanzos.has(byTag.id));

      const gluten = await search(tx, `gluten ${MARK}`);
      assert.ok(gluten.has(byTag.id));
      assert.ok(!gluten.has(byIngredient.id));

      assert.ok((await search(tx, `PIMIENTA ${MARK}`)).has(byIngredient.id));
    });
  });

  it("needs every term, in any order and across fields", async () => {
    await withRollback(async (tx) => {
      const both = await createRecipe(tx, {
        title: `Pollo asado ${MARK}`,
        ingredients: ["3 patatas"],
      });
      const onlyChicken = await createRecipe(tx, {
        title: `Pollo frito ${MARK}`,
        ingredients: ["2 huevos"],
      });
      const onlyPotatoes = await createRecipe(tx, {
        title: `Tortilla ${MARK}`,
        ingredients: ["3 patatas"],
      });

      for (const query of [
        "pollo patatas",
        "patatas pollo",
        "  pollo   patatas ",
      ]) {
        const ids = await search(tx, `${query} ${MARK}`);
        assert.ok(ids.has(both.id), query);
        assert.ok(!ids.has(onlyChicken.id), query);
        assert.ok(!ids.has(onlyPotatoes.id), query);
      }
      assert.equal((await search(tx, `pollo ${MARK}`)).size, 2);
      assert.equal((await search(tx, `${MARK} sin-coincidencia`)).size, 0);
    });
  });

  it("treats % _ and \\ as plain characters", async () => {
    await withRollback(async (tx) => {
      const percent = await createRecipe(tx, {
        title: `Oferta 100% natural ${MARK}`,
      });
      const noPercent = await createRecipe(tx, {
        title: `Oferta 100 natural ${MARK}`,
      });
      const underscore = await createRecipe(tx, { title: `a_b ${MARK}` });
      const letter = await createRecipe(tx, { title: `axb ${MARK}` });
      const slash = await createRecipe(tx, { title: `ruta c:\\dir ${MARK}` });

      const percentIds = await search(tx, `100% ${MARK}`);
      assert.ok(percentIds.has(percent.id));
      assert.ok(!percentIds.has(noPercent.id));

      const underscoreIds = await search(tx, `a_b ${MARK}`);
      assert.ok(underscoreIds.has(underscore.id));
      assert.ok(!underscoreIds.has(letter.id));

      // A lone wildcard is not "match everything"
      const wildcard = await search(tx, `% ${MARK}`);
      assert.deepEqual([...wildcard], [percent.id]);

      assert.ok((await search(tx, `c:\\dir ${MARK}`)).has(slash.id));
      assert.equal((await search(tx, `\\ ${MARK}`)).size, 1);
    });
  });

  it("bounds the query: too long is rejected, extra terms are ignored", async () => {
    await withRollback(async (tx) => {
      const user = await createUser(tx);
      const { recipe } = await callersFor(tx, user);

      await assert.rejects(
        recipe.getAll({ searchQuery: "a".repeat(101) }),
        (error: { code?: string }) => error.code === "BAD_REQUEST",
      );
      await recipe.getAll({ searchQuery: "a".repeat(100) });

      const target = await createRecipe(tx, {
        title: "uno dos tres cuatro cinco seis siete ocho",
      });
      // Only the first 8 terms count, so the 9th can't exclude the recipe
      const nine = "uno dos tres cuatro cinco seis siete ocho nueve";
      assert.ok((await search(tx, nine)).has(target.id));
      assert.ok(!(await search(tx, "nueve " + nine)).has(target.id));
    });
  });

  it("combines with the other filters and keeps pagination consistent", async () => {
    await withRollback(async (tx) => {
      const user = await createUser(tx);
      const { recipe } = await callersFor(tx, user);
      const made = [];
      for (const [index, cuisine] of [
        "Española",
        "Española",
        "Italiana",
      ].entries()) {
        made.push(
          await createRecipe(tx, {
            title: `Plato ${index} ${MARK}`,
            cuisine,
            ingredients: ["arroz"],
          }),
        );
      }

      const all = await recipe.getAll({
        searchQuery: `arroz ${MARK}`,
        limit: 50,
      });
      assert.equal(all.total, 3);
      assert.equal(all.items.length, 3);

      const spanish = await recipe.getAll({
        searchQuery: `ARROZ ${MARK}`,
        cuisine: ["Española"],
      });
      assert.equal(spanish.total, 2);

      const first = await recipe.getAll({ searchQuery: MARK, limit: 2 });
      assert.equal(first.total, 3);
      assert.equal(first.items.length, 2);
      assert.ok(first.nextCursor);
      const second = await recipe.getAll({
        searchQuery: MARK,
        limit: 2,
        cursor: first.nextCursor,
      });
      assert.deepEqual(
        [...first.items, ...second.items].map((item) => item.id).sort(),
        made.map((item) => item.id).sort(),
      );
      assert.equal(second.nextCursor, undefined);
    });
  });

  it("only offers cuisines as filter facets", async () => {
    await withRollback(async (tx) => {
      const { recipe } = await callersFor(tx, null);
      const facets = await recipe.getFilterFacets();
      assert.deepEqual(Object.keys(facets), ["cuisines"]);
    });
  });
});
