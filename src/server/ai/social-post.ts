import { RecipeDraftParseError, parseRecipeDraft } from "./parse-recipe-draft";

export type SocialPlatform = "YouTube" | "Instagram" | "TikTok";

export type SocialLink = {
  platform: SocialPlatform;
  canonicalUrl: string;
  id: string;
};

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,30}$/;

const decodeEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const withProtocol = (value: string) => {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

export const parseSocialUrl = (input: string): SocialLink | null => {
  let url: URL;
  try {
    url = new URL(withProtocol(input));
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host.endsWith(".youtu.be")) {
    const id = parts[0];
    if (!id || !YOUTUBE_ID.test(id)) {
      return null;
    }

    return {
      platform: "YouTube",
      id,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    let id = url.searchParams.get("v");
    if (
      !id &&
      parts[1] &&
      (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live")
    ) {
      id = parts[1];
    }

    if (!id || !YOUTUBE_ID.test(id)) {
      return null;
    }

    return {
      platform: "YouTube",
      id,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (
    host === "tiktok.com" ||
    host === "m.tiktok.com" ||
    host === "vm.tiktok.com" ||
    host === "vt.tiktok.com"
  ) {
    if (
      parts.length >= 3 &&
      (parts[1] === "video" || parts[1] === "photo") &&
      /^\d{6,30}$/.test(parts[2] ?? "")
    ) {
      return {
        platform: "TikTok",
        id: parts[2] ?? "",
        canonicalUrl: `https://www.tiktok.com/${parts[0]}/${parts[1]}/${parts[2]}`,
      };
    }

    if (
      host === "vm.tiktok.com" ||
      host === "vt.tiktok.com" ||
      parts[0] === "t"
    ) {
      const id = parts.at(-1) ?? "short";
      return {
        platform: "TikTok",
        id,
        canonicalUrl: `https://${host}/${parts.join("/")}`,
      };
    }

    return null;
  }

  if (host === "instagram.com") {
    const kind = parts[0];
    const code = parts[1];
    if (
      !code ||
      !INSTAGRAM_CODE.test(code) ||
      (kind !== "p" && kind !== "reel" && kind !== "reels" && kind !== "tv")
    ) {
      return null;
    }

    const segment = kind === "reels" ? "reel" : kind === "tv" ? "p" : kind;
    return {
      platform: "Instagram",
      id: code,
      canonicalUrl: `https://www.instagram.com/${segment}/${code}/`,
    };
  }

  return null;
};

const readMeta = (html: string, key: string) => {
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      return decodeEntities(match[1]).trim();
    }
  }

  return null;
};

export const readJsonStrings = (html: string, key: string, limit = 4) => {
  const marker = `"${key}":"`;
  const values: string[] = [];
  let from = 0;

  while (values.length < limit) {
    const start = html.indexOf(marker, from);
    if (start < 0) {
      break;
    }

    let index = start + marker.length;
    let value = "";

    while (index < html.length) {
      const char = html[index];
      if (char === "\\") {
        const next = html[index + 1];
        if (next === "u") {
          const hex = html.slice(index + 2, index + 6);
          const code = Number.parseInt(hex, 16);
          value += Number.isNaN(code) ? "" : String.fromCharCode(code);
          index += 6;
          continue;
        }

        const escaped: Record<string, string> = {
          n: "\n",
          r: "\r",
          t: "\t",
          '"': '"',
          "\\": "\\",
          "/": "/",
        };
        value += escaped[next ?? ""] ?? next ?? "";
        index += 2;
        continue;
      }

      if (char === '"') {
        break;
      }

      value += char;
      index += 1;
    }

    from = index + 1;
    if (value.trim()) {
      values.push(value.trim());
    }
  }

  return values;
};

const cleanYouTubeTitle = (title: string) =>
  title.replace(/\s+-\s+YouTube\s*$/i, "").trim();

export const extractYouTubePost = (html: string) => {
  const descriptions = readJsonStrings(html, "shortDescription");
  const text =
    descriptions.find((description) => description.length >= 40) ??
    descriptions[0] ??
    "";
  const title = cleanYouTubeTitle(
    readMeta(html, "og:title") ?? readMeta(html, "title") ?? "",
  );

  if (!text && !title) {
    return null;
  }

  return { title, text };
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const findTikTokItem = (
  value: unknown,
): { desc: string; cover: string | null } | null => {
  const record = asRecord(value);
  if (!record) {
    if (!Array.isArray(value)) {
      return null;
    }

    for (const item of value) {
      const found = findTikTokItem(item);
      if (found) {
        return found;
      }
    }

    return null;
  }

  const video = asRecord(record.video);
  if (typeof record.desc === "string" && record.desc.trim() && video) {
    const cover = [video.cover, video.originCover, video.dynamicCover].find(
      (item) => typeof item === "string" && item.startsWith("https://"),
    );

    return {
      desc: record.desc.trim(),
      cover: typeof cover === "string" ? cover : null,
    };
  }

  for (const child of Object.values(record)) {
    const found = findTikTokItem(child);
    if (found) {
      return found;
    }
  }

  return null;
};

export const extractTikTokPost = (html: string) => {
  const marker = 'id="__UNIVERSAL_DATA_FOR_REHYDRATION__"';
  const markerAt = html.indexOf(marker);
  if (markerAt < 0) {
    return null;
  }

  const open = html.indexOf(">", markerAt);
  const close = html.indexOf("</script>", open);
  if (open < 0 || close < 0) {
    return null;
  }

  try {
    const item = findTikTokItem(JSON.parse(html.slice(open + 1, close)));
    if (!item) {
      return null;
    }

    return {
      title: "",
      text: item.desc,
      thumbnailUrl: item.cover,
    };
  } catch {
    return null;
  }
};

export const extractInstagramPost = (html: string) => {
  const text = readMeta(html, "og:description");
  const title = readMeta(html, "og:title");
  const loginWall =
    !text &&
    (/login/i.test(html) || /content="Instagram"/i.test(html.slice(0, 4000)));

  return {
    title: title ?? "",
    text: text ?? "",
    thumbnailUrl: readMeta(html, "og:image"),
    loginWall,
  };
};

const SKIPPED_LINK_HOSTS = [
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "instagram.com",
  "facebook.com",
  "fb.watch",
  "twitter.com",
  "x.com",
  "linktr.ee",
  "wa.me",
  "spotify.com",
];

export const extractExternalRecipeLink = (text: string) => {
  const matches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? [];

  for (const match of matches) {
    try {
      const url = new URL(match.replace(/[.,]+$/, ""));
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      const skipped = SKIPPED_LINK_HOSTS.some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`),
      );
      if (url.protocol === "https:" && !skipped) {
        return url.toString();
      }
    } catch {
      continue;
    }
  }

  return null;
};

const collectNodes = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectNodes(item));
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  if (Array.isArray(record["@graph"])) {
    return record["@graph"].flatMap((item) => collectNodes(item));
  }

  return [record];
};

const isRecipeNode = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }

  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some((item) => {
    const name = String(item ?? "").toLowerCase();
    return name === "recipe" || name.endsWith("/recipe");
  });
};

const isoDurationToMinutes = (value: unknown) => {
  if (typeof value !== "string") {
    return 0;
  }

  const match =
    /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(
      value.trim(),
    );
  if (!match) {
    return 0;
  }

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
};

const asText = (value: unknown) => {
  if (typeof value === "string") {
    return value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
};

const collectInstructions = (value: unknown): string[] => {
  if (typeof value === "string") {
    const text = asText(value);
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectInstructions(item));
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const text = asText(record.text ?? record.name);
  const nested = collectInstructions(
    record.itemListElement ?? record["@list"] ?? [],
  );

  return text ? [text, ...nested] : nested;
};

const recipeImageUrl = (value: unknown): string | null => {
  if (typeof value === "string" && value.startsWith("https://")) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = recipeImageUrl(item);
      if (found) {
        return found;
      }
    }

    return null;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return recipeImageUrl(record.url ?? record.contentUrl);
};

const servingsFromYield = (value: unknown) => {
  const text = Array.isArray(value) ? asText(value[0]) : asText(value);
  const match = /(\d+)/.exec(text);
  return match ? Number(match[1]) : 2;
};

export const extractRecipeDraftFromHtml = (html: string) => {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const script of scripts) {
    const raw = script[1];
    if (!raw) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const recipe = collectNodes(parsed).find((node) => isRecipeNode(node));
    const record = asRecord(recipe);
    if (!record) {
      continue;
    }

    const ingredients = (
      Array.isArray(record.recipeIngredient) ? record.recipeIngredient : []
    )
      .map((item) => asText(item))
      .filter(Boolean);
    const instructions = collectInstructions(record.recipeInstructions);
    const keywords = asText(record.keywords);
    const tags = keywords
      .split(/[,;]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const draft = parseRecipeDraft(
        JSON.stringify({
          title: asText(record.name),
          description:
            asText(record.description) ||
            "Receta importada desde la página enlazada.",
          cuisine: asText(record.recipeCuisine) || "Otra",
          difficulty: "Medium",
          cookTime: isoDurationToMinutes(record.cookTime),
          prepTime: isoDurationToMinutes(record.prepTime),
          servings: servingsFromYield(record.recipeYield),
          ingredients,
          instructions,
          tags,
        }),
      );

      return { draft, image: recipeImageUrl(record.image) };
    } catch (error) {
      if (error instanceof RecipeDraftParseError) {
        continue;
      }

      throw error;
    }
  }

  return null;
};
