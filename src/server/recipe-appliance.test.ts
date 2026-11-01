import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Prisma } from "../../generated/prisma/client";
import type { db as Database } from "./db";
import type { recipeRouter as Router } from "./api/routers/recipe";
import { recipeApplianceCondition } from "./recipe-appliance";

// Read-only integration checks; no fixture rows are inserted into the database.
// pnpm exec tsx --env-file=.env --conditions=react-server --test src/server/recipe-appliance.test.ts
describe(
  "appliance filtering in PostgreSQL",
  { skip: !process.env.DATABASE_URL },
  () => {
    let db: typeof Database;
    let caller: ReturnType<typeof Router.createCaller>;
    before(async () => {
      ({ db } = await import("./db"));
      const { recipeRouter } = await import("./api/routers/recipe");
      caller = recipeRouter.createCaller({
        db,
        session: null,
        headers: new Headers(),
      });
    });
    after(async () => {
      await db?.$disconnect();
    });

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
      for (const recipe of cases) {
        for (const appliance of ["airfryer", "mambo"] as const) {
          const rows = await db.$queryRaw<{ matches: boolean }[]>(Prisma.sql`
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

    for (const appliance of ["airfryer", "mambo"] as const) {
      it(`paginates and counts ${appliance} consistently through the real router`, async () => {
        const full = await caller.getAll({ appliance, limit: 50 });
        assert.ok(
          full.items.length > 0,
          "Expected appliance recipes in the configured database",
        );
        assert.equal(full.total, full.items.length);
        const ids: string[] = [];
        let cursor: string | undefined;
        do {
          const page = await caller.getAll({ appliance, limit: 2, cursor });
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
          searchQuery: sample.title,
          cuisine: [sample.cuisine],
          difficulty: [sample.difficulty],
          ingredients: sample.ingredients.slice(0, 1),
          dietaryRestrictions: sample.tags.slice(0, 1),
          maxTotalTime: sample.prepTime + sample.cookTime || 1,
          limit: 50,
        });
        assert.ok(combined.items.some((r) => r.id === sample.id));
        const empty = await caller.getAll({
          appliance,
          searchQuery: "__no_recipe_appliance_test__",
        });
        assert.equal(empty.total, 0);
        assert.deepEqual(empty.items, []);
      });
    }
  },
);
