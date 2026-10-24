import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isBlockedHostname, isPrivateAddress } from "./public-url";
import {
  extractExternalRecipeLink,
  extractInstagramPost,
  extractRecipeDraftFromHtml,
  extractTikTokPost,
  extractYouTubePost,
  parseSocialUrl,
} from "./social-post";

describe("parseSocialUrl", () => {
  it("accepts YouTube, TikTok, and Instagram links", () => {
    assert.deepEqual(parseSocialUrl("https://youtu.be/dQw4w9WgXcQ?si=abc"), {
      platform: "YouTube",
      id: "dQw4w9WgXcQ",
      canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    assert.equal(
      parseSocialUrl("https://www.youtube.com/shorts/abcdefghijk")?.id,
      "abcdefghijk",
    );
    assert.equal(
      parseSocialUrl(
        "https://www.tiktok.com/@savor.the.journey/video/7617130541871009055",
      )?.platform,
      "TikTok",
    );
    assert.equal(
      parseSocialUrl("https://vm.tiktok.com/ZMabcdef/")?.canonicalUrl,
      "https://vm.tiktok.com/ZMabcdef",
    );
    assert.equal(
      parseSocialUrl("https://www.instagram.com/reel/Abcde12345/")?.platform,
      "Instagram",
    );
  });

  it("rejects other sites", () => {
    assert.equal(parseSocialUrl("https://example.com/recipe"), null);
    assert.equal(parseSocialUrl("javascript:alert(1)"), null);
  });
});

describe("post extractors", () => {
  it("reads a YouTube description", () => {
    const post = extractYouTubePost(`
      <meta property="og:title" content="Tortilla de patata - YouTube">
      <script>"shortDescription":"4 huevos y 3 patatas.\\nCuajar por los dos lados."</script>
    `);

    assert.equal(post?.title, "Tortilla de patata");
    assert.match(post?.text ?? "", /4 huevos/);
    assert.match(post?.text ?? "", /dos lados/);
  });

  it("reads a TikTok caption and cover", () => {
    const post = extractTikTokPost(`
      <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
        {"__DEFAULT_SCOPE__":{"webapp.video-detail":{"itemInfo":{"itemStruct":{
          "desc":"Pollo al ajillo. 2 pechugas y 4 dientes de ajo.",
          "video":{"cover":"https://p16-common-sign.tiktokcdn-eu.com/cover.jpeg"}
        }}}}}
      </script>
    `);

    assert.match(post?.text ?? "", /Pollo al ajillo/);
    assert.equal(
      post?.thumbnailUrl,
      "https://p16-common-sign.tiktokcdn-eu.com/cover.jpeg",
    );
  });

  it("treats an Instagram login page as unreadable", () => {
    const post = extractInstagramPost(
      '<html><head><meta property="og:title" content="Instagram"></head><body>Login</body></html>',
    );

    assert.equal(post.loginWall, true);
    assert.equal(post.text, "");
  });

  it("follows a recipe page linked from the caption", () => {
    assert.equal(
      extractExternalRecipeLink(
        "Receta completa en https://www.youtube.com/watch?v=dQw4w9WgXcQ y https://blog.example.com/tortilla.",
      ),
      "https://blog.example.com/tortilla",
    );
  });

  it("maps schema.org Recipe data", () => {
    const imported = extractRecipeDraftFromHtml(`
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Recipe","name":"Sopa de ajo",
         "description":"Sopa caliente de ajo y pan.","recipeCuisine":"Española",
         "prepTime":"PT10M","cookTime":"PT20M","recipeYield":"2 raciones",
         "recipeIngredient":["ajo","pan"],
         "recipeInstructions":[{"@type":"HowToStep","text":"Hervir el caldo"}],
         "keywords":"sopa, ajo","image":"https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg"}
      </script>
    `);

    assert.equal(imported?.draft.title, "Sopa de ajo");
    assert.equal(imported?.draft.prepTime, 10);
    assert.equal(imported?.draft.cookTime, 20);
    assert.equal(imported?.draft.servings, 2);
    assert.deepEqual(imported?.draft.ingredients, ["ajo", "pan"]);
    assert.equal(
      imported?.image,
      "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
    );
  });
});

describe("public address checks", () => {
  it("blocks private hosts and allows public addresses", () => {
    assert.equal(isPrivateAddress("127.0.0.1"), true);
    assert.equal(isPrivateAddress("10.1.2.3"), true);
    assert.equal(isPrivateAddress("169.254.169.254"), true);
    assert.equal(isPrivateAddress("8.8.8.8"), false);
    assert.equal(isPrivateAddress("2001:4860:4860::8888"), false);
    assert.equal(isBlockedHostname("localhost"), true);
    assert.equal(isBlockedHostname("metadata.google.internal"), true);
    assert.equal(isBlockedHostname("www.youtube.com"), false);
  });
});
