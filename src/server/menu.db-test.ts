import assert from "node:assert/strict";
import { it } from "node:test";

import {
  callersFor,
  createRecipe,
  createUser,
  describeDatabase,
  withRollback,
} from "./test-db";

describeDatabase("menu schedule in PostgreSQL", () => {
  it("allows a recipe once per family, date and meal", async () => {
    await withRollback(async (tx) => {
      const user = await createUser(tx);
      const [family, otherFamily] = await Promise.all([
        tx.family.create({ data: { name: "Casa" } }),
        tx.family.create({ data: { name: "Otra casa" } }),
      ]);
      await tx.familyMember.createMany({
        data: [family, otherFamily].map(({ id }) => ({
          familyId: id,
          userId: user.id,
        })),
      });
      const recipe = await createRecipe(tx);
      const { menu } = await callersFor(tx, user);

      const entry = {
        familyId: family.id,
        recipeId: recipe.id,
        date: "2030-01-15",
        mealType: "LUNCH",
      } as const;

      await menu.scheduleRecipe(entry);
      // Same recipe in another meal, on another day or for another family
      await menu.scheduleRecipe({ ...entry, mealType: "DINNER" });
      await menu.scheduleRecipe({ ...entry, date: "2030-01-16" });
      await menu.scheduleRecipe({ ...entry, familyId: otherFamily.id });
      // Another recipe in the same meal
      const second = await createRecipe(tx);
      await menu.scheduleRecipe({ ...entry, recipeId: second.id });

      assert.equal(await tx.menuSchedule.count(), 5);

      // Last on purpose: the failed insert aborts the transaction
      await assert.rejects(
        menu.scheduleRecipe(entry),
        (error: { code?: string; message?: string }) =>
          error.code === "CONFLICT" &&
          /ya está en el menú/.test(error.message ?? ""),
      );
    });
  });

  it("still refuses people outside the family", async () => {
    await withRollback(async (tx) => {
      const outsider = await createUser(tx);
      const family = await tx.family.create({ data: { name: "Casa" } });
      const recipe = await createRecipe(tx);
      const { menu } = await callersFor(tx, outsider);

      await assert.rejects(
        menu.scheduleRecipe({
          familyId: family.id,
          recipeId: recipe.id,
          date: "2030-01-15",
          mealType: "LUNCH",
        }),
        (error: { code?: string }) => error.code === "FORBIDDEN",
      );
    });
  });
});
