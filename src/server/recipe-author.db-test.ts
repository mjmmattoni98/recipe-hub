import assert from "node:assert/strict";
import { it } from "node:test";

import {
  callersFor,
  createRecipe,
  createUser,
  describeDatabase,
  withRollback,
} from "./test-db";

// Only the shape matters here; the image is a Vercel Blob URL so that
// creating and updating a recipe doesn't need the network.
const BLOB_IMAGE = "https://test.public.blob.vercel-storage.com/recipes/a.jpg";

const rejectsWith = (code: string) => (error: unknown) =>
  (error as { code?: string }).code === code;

describeDatabase("recipe authors in PostgreSQL", () => {
  it("records who created a recipe without exposing it", async () => {
    await withRollback(async (tx) => {
      const author = await createUser(tx);
      const { recipe } = await callersFor(tx, author);

      const created = await recipe.create({
        title: "Mi receta",
        description: "Descripción",
        cuisine: "Española",
        difficulty: "Easy",
        cookTime: 10,
        prepTime: 5,
        servings: 2,
        ingredients: ["1 huevo"],
        instructions: ["Cocinar"],
        image: BLOB_IMAGE,
        tags: [],
      });

      const stored = await tx.recipe.findUniqueOrThrow({
        where: { id: created.id },
      });
      assert.equal(stored.createdById, author.id);
      assert.ok(!("createdById" in created));

      const fetched = await recipe.getById({ id: created.id });
      assert.ok(fetched);
      assert.ok(!("createdById" in fetched));
      assert.equal(fetched.canDelete, true);

      const list = await recipe.getAll({ searchQuery: "Mi receta", limit: 50 });
      const item = list.items.find((entry) => entry.id === created.id);
      assert.ok(item);
      assert.ok(!("createdById" in item));
    });
  });

  it("tells each viewer whether they can delete", async () => {
    await withRollback(async (tx) => {
      const author = await createUser(tx);
      const other = await createUser(tx);
      const admin = await createUser(tx, "admin");
      const owned = await createRecipe(tx, { createdById: author.id });
      const orphan = await createRecipe(tx);

      const canDelete = async (viewer: typeof author | null, id: string) =>
        (await (await callersFor(tx, viewer)).recipe.getById({ id }))
          ?.canDelete;

      assert.equal(await canDelete(author, owned.id), true);
      assert.equal(await canDelete(admin, owned.id), true);
      assert.equal(await canDelete(other, owned.id), false);
      assert.equal(await canDelete(null, owned.id), false);

      assert.equal(await canDelete(author, orphan.id), false);
      assert.equal(await canDelete(admin, orphan.id), true);
    });
  });

  it("lets only the author or an admin delete", async () => {
    await withRollback(async (tx) => {
      const author = await createUser(tx);
      const other = await createUser(tx);
      const admin = await createUser(tx, "admin");
      const owned = await createRecipe(tx, { createdById: author.id });
      const orphan = await createRecipe(tx);
      const exists = async (id: string) =>
        (await tx.recipe.count({ where: { id } })) === 1;

      const asOther = (await callersFor(tx, other)).recipe;
      await assert.rejects(
        asOther.delete({ id: owned.id }),
        rejectsWith("FORBIDDEN"),
      );
      await assert.rejects(
        asOther.delete({ id: orphan.id }),
        rejectsWith("FORBIDDEN"),
      );
      assert.ok(await exists(owned.id));
      assert.ok(await exists(orphan.id));

      await assert.rejects(
        (await callersFor(tx, author)).recipe.delete({ id: orphan.id }),
        rejectsWith("FORBIDDEN"),
      );
      assert.ok(await exists(orphan.id));

      await (await callersFor(tx, author)).recipe.delete({ id: owned.id });
      assert.ok(!(await exists(owned.id)));

      const adminCaller = (await callersFor(tx, admin)).recipe;
      await adminCaller.delete({ id: orphan.id });
      assert.ok(!(await exists(orphan.id)));

      const others = await createRecipe(tx, { createdById: other.id });
      await adminCaller.delete({ id: others.id });
      assert.ok(!(await exists(others.id)));

      await assert.rejects(
        adminCaller.delete({ id: others.id }),
        rejectsWith("NOT_FOUND"),
      );
    });
  });

  it("keeps editing open to any signed-in user", async () => {
    await withRollback(async (tx) => {
      const author = await createUser(tx);
      const other = await createUser(tx);
      const owned = await createRecipe(tx, {
        createdById: author.id,
        image: BLOB_IMAGE,
      });

      const { recipe } = await callersFor(tx, other);
      const updated = await recipe.update({
        id: owned.id,
        title: "Editada",
        description: owned.description,
        cuisine: owned.cuisine,
        difficulty: owned.difficulty,
        cookTime: owned.cookTime,
        prepTime: owned.prepTime,
        servings: owned.servings,
        ingredients: owned.ingredients,
        instructions: owned.instructions,
        image: BLOB_IMAGE,
        tags: owned.tags,
      });

      assert.equal(updated.title, "Editada");
      assert.ok(!("createdById" in updated));
      const stored = await tx.recipe.findUniqueOrThrow({
        where: { id: owned.id },
      });
      assert.equal(stored.createdById, author.id);
    });
  });

  it("leaves the recipe with no author when its author is deleted", async () => {
    await withRollback(async (tx) => {
      const author = await createUser(tx);
      const owned = await createRecipe(tx, { createdById: author.id });

      await tx.user.delete({ where: { id: author.id } });

      const stored = await tx.recipe.findUniqueOrThrow({
        where: { id: owned.id },
      });
      assert.equal(stored.createdById, null);
    });
  });
});
