import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canDeleteRecipe } from "./recipe-permissions";

describe("canDeleteRecipe", () => {
  const author = { id: "author", role: "user" };
  const other = { id: "other", role: "user" };
  const admin = { id: "admin", role: "admin" };

  it("lets the author delete their own recipe", () => {
    assert.equal(canDeleteRecipe(author, { createdById: "author" }), true);
  });

  it("lets an admin delete anyone's recipe, including ones with no author", () => {
    assert.equal(canDeleteRecipe(admin, { createdById: "author" }), true);
    assert.equal(canDeleteRecipe(admin, { createdById: null }), true);
    assert.equal(
      canDeleteRecipe({ id: "x", role: "user,admin" }, { createdById: null }),
      true,
    );
  });

  it("refuses everyone else", () => {
    assert.equal(canDeleteRecipe(other, { createdById: "author" }), false);
    assert.equal(canDeleteRecipe(other, { createdById: null }), false);
    assert.equal(canDeleteRecipe({ id: "x" }, { createdById: null }), false);
    assert.equal(canDeleteRecipe(null, { createdById: "author" }), false);
    assert.equal(canDeleteRecipe(undefined, { createdById: null }), false);
  });
});
