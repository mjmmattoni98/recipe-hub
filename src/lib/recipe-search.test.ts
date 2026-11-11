import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  escapeLikePattern,
  MAX_SEARCH_TERMS,
  searchTerms,
} from "./recipe-search";

describe("searchTerms", () => {
  it("splits on any whitespace and ignores empty terms", () => {
    assert.deepEqual(searchTerms("  pollo \t patatas\n"), ["pollo", "patatas"]);
    assert.deepEqual(searchTerms("   "), []);
    assert.deepEqual(searchTerms(""), []);
  });

  it("keeps only the first terms past the cap", () => {
    const terms = searchTerms("a b c d e f g h i j");
    assert.equal(terms.length, MAX_SEARCH_TERMS);
    assert.equal(terms.at(-1), "h");
  });
});

describe("escapeLikePattern", () => {
  it("escapes wildcards and the escape character itself", () => {
    assert.equal(escapeLikePattern("100%"), "100\\%");
    assert.equal(escapeLikePattern("a_b"), "a\\_b");
    assert.equal(escapeLikePattern("c:\\dir"), "c:\\\\dir");
    assert.equal(escapeLikePattern("salmón"), "salmón");
  });
});
