import "server-only";

import { env } from "@/env";
import {
  fetchPublicImage,
  fetchPublicText,
  PublicFetchError,
} from "@/server/ai/public-fetch";
import type { RecipeDraft } from "@/server/ai/parse-recipe-draft";
import { structureRecipeFromText } from "@/server/ai/recipe-draft";
import {
  extractExternalRecipeLink,
  extractInstagramPost,
  extractRecipeDraftFromHtml,
  extractTikTokPost,
  extractYouTubePost,
  parseSocialUrl,
  type SocialLink,
  type SocialPlatform,
} from "@/server/ai/social-post";
import { put } from "@vercel/blob";
import sharp from "sharp";

export class SocialImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialImportError";
  }
}

const PLATFORM_HOSTS: Record<SocialPlatform, string[]> = {
  YouTube: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  TikTok: ["tiktok.com"],
  Instagram: ["instagram.com"],
};

const INSTAGRAM_MESSAGE =
  "Instagram no muestra el texto de la publicación desde aquí. Copia el pie de foto y usa Generar con IA.";

const SHORT_TEXT_MESSAGE =
  "Este enlace no incluye la receta por escrito. Copia el texto y usa Generar con IA.";

const toImportError = (error: unknown) => {
  if (error instanceof SocialImportError || error instanceof PublicFetchError) {
    return new SocialImportError(error.message);
  }

  return error;
};

const storeImportedImage = async (imageUrl: string, id: string) => {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const image = await fetchPublicImage(imageUrl);
    const optimized = await sharp(image.bytes)
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    const safeId =
      id
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24) || "post";
    const blob = await put(
      `recipes/import-${safeId}-${Date.now()}.jpg`,
      optimized,
      {
        access: "public",
        token: env.BLOB_READ_WRITE_TOKEN,
        contentType: "image/jpeg",
        addRandomSuffix: false,
      },
    );

    return blob.url;
  } catch {
    return null;
  }
};

const loadPost = async (link: SocialLink) => {
  const page = await fetchPublicText(link.canonicalUrl, {
    allowedHostSuffixes: PLATFORM_HOSTS[link.platform],
  });

  if (link.platform === "YouTube") {
    const extracted = extractYouTubePost(page.text);
    if (!extracted?.text) {
      throw new SocialImportError(SHORT_TEXT_MESSAGE);
    }

    return {
      title: extracted.title,
      text: extracted.text,
      thumbnailUrl: `https://i.ytimg.com/vi/${link.id}/hqdefault.jpg`,
      canonicalUrl: link.canonicalUrl,
    };
  }

  if (link.platform === "TikTok") {
    const extracted = extractTikTokPost(page.text);
    if (!extracted?.text) {
      throw new SocialImportError(SHORT_TEXT_MESSAGE);
    }

    const resolved = parseSocialUrl(page.finalUrl);

    return {
      title: extracted.title,
      text: extracted.text,
      thumbnailUrl: extracted.thumbnailUrl,
      canonicalUrl: resolved?.canonicalUrl ?? link.canonicalUrl,
    };
  }

  const extracted = extractInstagramPost(page.text);
  if (extracted.loginWall || extracted.text.trim().length < 40) {
    throw new SocialImportError(INSTAGRAM_MESSAGE);
  }

  return {
    title: extracted.title,
    text: extracted.text,
    thumbnailUrl: extracted.thumbnailUrl,
    canonicalUrl: link.canonicalUrl,
  };
};

export const importSocialRecipe = async (rawUrl: string) => {
  const link = parseSocialUrl(rawUrl);
  if (!link) {
    throw new SocialImportError(
      "Pega un enlace de YouTube, TikTok o Instagram.",
    );
  }

  let post: Awaited<ReturnType<typeof loadPost>>;
  try {
    post = await loadPost(link);
  } catch (error) {
    throw toImportError(error);
  }

  if (post.text.trim().length < 40) {
    throw new SocialImportError(SHORT_TEXT_MESSAGE);
  }

  const blogLink =
    post.text.trim().length < 280 ? extractExternalRecipeLink(post.text) : null;
  let blogImage: string | null = null;
  let draft: RecipeDraft | null = null;

  if (blogLink) {
    try {
      const blog = await fetchPublicText(blogLink, {
        maxBytes: 1_000_000,
        timeoutMs: 6_000,
      });
      const fromPage = extractRecipeDraftFromHtml(blog.text);
      if (fromPage) {
        draft = fromPage.draft;
        blogImage = fromPage.image;
      }
    } catch {
      draft = null;
    }
  }

  if (!draft) {
    const sourceText = [post.title, post.text].filter(Boolean).join("\n\n");
    draft = await structureRecipeFromText(sourceText);
  }

  const imageUrl = post.thumbnailUrl ?? blogImage;
  const image = imageUrl ? await storeImportedImage(imageUrl, link.id) : null;

  return {
    ...draft,
    image,
    videoSource: {
      platform: link.platform,
      url: post.canonicalUrl,
    },
  };
};
