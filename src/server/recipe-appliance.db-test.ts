import assert from "node:assert/strict";
import { it } from "node:test";
import { Prisma } from "../../generated/prisma/client";
import { recipeApplianceCondition } from "./recipe-appliance";
import {
  callersFor,
  createRecipe,
  createUser,
  describeDatabase,
  withRollback,
} from "./test-db";

// Queries carry this word, so rows already in the database can never show up
// in (or hide) the results.
const MARK = "qzxappliance";

describeDatabase("appliance filtering in PostgreSQL", () => {
  it("recognizes aliases in each field without partial or cross-field matches", async () => {
    const cases = [
      {
        title: "Pollo en Air Fryer",
        tags: [],
        instructions: [],
        airfryer: true,
        mambo: false,
      },
      {
        title: "Guiso",
        tags: ["MAMBO"],
        instructions: [],
        airfryer: false,
        mambo: true,
      },
      {
        title: "Bowl",
        tags: [],
        instructions: ["Cocina en freidora de aire."],
        airfryer: true,
        mambo: false,
      },
      {
        title: "Pollo",
        tags: ["air-fryer"],
        instructions: ["Salsa en Mambo."],
        airfryer: true,
        mambo: true,
      },
      {
        title: "Cecofry: merluza",
        tags: [],
        instructions: [],
        airfryer: true,
        mambo: false,
      },
      {
        title: "Freidora sin aceite",
        tags: [],
        instructions: [],
        airfryer: true,
        mambo: false,
      },
      {
        title: "Mamborama",
        tags: ["airfryerish"],
        instructions: [],
        airfryer: false,
        mambo: false,
      },
      {
        title: "Pollo",
        tags: ["air", "fryer"],
        instructions: [],
        airfryer: false,
        mambo: false,
      },
      {
        title: "Airfryer",
        tags: [],
        instructions: [],
        airfryer: true,
        mambo: false,
      },
    ];
    await withRollback(async (tx) => {
      for (const recipe of cases) {
        for (const appliance of ["airfryer", "mambo"] as const) {
          const rows = await tx.$queryRaw<{ matches: boolean }[]>(Prisma.sql`
            WITH r AS (
              SELECT ${recipe.title}::text AS "title", ${recipe.tags}::text[] AS "tags",
                ${recipe.instructions}::text[] AS "instructions"
            )
            SELECT ${recipeApplianceCondition(appliance)} AS matches FROM r
          `);
          assert.equal(
            rows[0]?.matches,
            recipe[appliance],
            `${appliance}: ${recipe.title}`,
          );
        }
      }
    });
  });

  for (const appliance of ["airfryer", "mambo"] as const) {
    it(`paginates and counts ${appliance} consistently through the real router`, async () => {
      await withRollback(async (tx) => {
        const user = await createUser(tx);
        const { recipe: caller } = await callersFor(tx, user);
        const keyword = appliance === "airfryer" ? "airfryer" : "Mambo";
        const expected = [];
        for (const index of [1, 2, 3, 4, 5]) {
          expected.push(
            await createRecipe(tx, {
              title: `${MARK} plato ${index}`,
              cuisine: index % 2 ? "Española" : "Italiana",
              difficulty: index % 2 ? "Easy" : "Medium",
              prepTime: 10,
              cookTime: 20,
              ingredients: ["arroz"],
              tags: ["vegetarian"],
              instructions: [`Cocinar en ${keyword}.`],
            }),
          );
        }
        const other = appliance === "airfryer" ? "Mambo" : "airfryer";
        await createRecipe(tx, {
          title: `${MARK} otro aparato`,
          instructions: [`Cocinar en ${other}.`],
        });
        await createRecipe(tx, {
          title: `${MARK} sin aparato`,
          instructions: ["Cocinar en el horno."],
        });

        const full = await caller.getAll({
          appliance,
          searchQuery: MARK,
          limit: 50,
        });
        assert.equal(full.total, expected.length);
        assert.equal(full.items.length, expected.length);

        const ids: string[] = [];
        let cursor: string | undefined;
        do {
          const page = await caller.getAll({
            appliance,
            searchQuery: MARK,
            limit: 2,
            cursor,
          });
          if (cursor === undefined) assert.equal(page.total, full.total);
          ids.push(...page.items.map((r) => r.id));
          cursor = page.nextCursor;
          assert.ok(
            ids.length <= full.items.length,
            "Pagination must terminate without duplicates",
          );
        } while (cursor);
        assert.deepEqual(
          ids,
          full.items.map((r) => r.id),
        );

        const sample = full.items[0];
        assert.ok(sample);
        const combined = await caller.getAll({
          appliance,
          searchQuery: `${MARK} arroz`,
          cuisine: [sample.cuisine],
          difficulty: [sample.difficulty],
          dietaryRestrictions: sample.tags.slice(0, 1),
          maxTotalTime: sample.prepTime + sample.cookTime,
          limit: 50,
        });
        assert.ok(combined.items.some((r) => r.id === sample.id));
        assert.ok(combined.items.every((r) => r.cuisine === sample.cuisine));

        const tooShort = await caller.getAll({
          appliance,
          searchQuery: MARK,
          maxTotalTime: 1,
        });
        assert.equal(tooShort.total, 0);

        const empty = await caller.getAll({
          appliance,
          searchQuery: "__no_recipe_appliance_test__",
        });
        assert.equal(empty.total, 0);
        assert.deepEqual(empty.items, []);
      });
    });
  }
});
