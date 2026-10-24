import * as z from "zod";

export class RecipeDraftParseError extends Error {
  constructor() {
    super(
      "La respuesta de la IA no tenía una receta completa. Prueba con un texto más detallado.",
    );
    this.name = "RecipeDraftParseError";
  }
}

export const RECIPE_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    cuisine: { type: "string" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
    cookTime: { type: "integer" },
    prepTime: { type: "integer" },
    servings: { type: "integer" },
    ingredients: { type: "array", items: { type: "string" } },
    instructions: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "description",
    "cuisine",
    "difficulty",
    "cookTime",
    "prepTime",
    "servings",
    "ingredients",
    "instructions",
    "tags",
  ],
};

const recipeDraftSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(2000),
  cuisine: z.string().trim().min(1).max(80),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  cookTime: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
  prepTime: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
  servings: z.number().int().min(1).max(100),
  ingredients: z.array(z.string().trim().min(1).max(240)).min(1).max(80),
  instructions: z.array(z.string().trim().min(1).max(1000)).min(1).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
});

export type RecipeDraft = z.infer<typeof recipeDraftSchema>;

const DIETARY_TAGS: Record<string, string> = {
  vegetarian: "vegetarian",
  vegetariana: "vegetarian",
  vegetariano: "vegetarian",
  vegan: "vegan",
  vegana: "vegan",
  vegano: "vegan",
  "gluten-free": "gluten-free",
  "gluten free": "gluten-free",
  "sin gluten": "gluten-free",
  "sin-gluten": "gluten-free",
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const stripThinking = (text: string) =>
  text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

export const extractJsonObject = (text: string): unknown => {
  const source = stripThinking(text);
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(source);
  const body = fenced?.[1] ?? source;
  const start = body.indexOf("{");

  if (start === -1) {
    throw new RecipeDraftParseError();
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < body.length; index += 1) {
    const char = body[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(body.slice(start, index + 1));
        } catch {
          throw new RecipeDraftParseError();
        }
      }
    }
  }

  throw new RecipeDraftParseError();
};

const asStringList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const asMinutes = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(24 * 60, Math.round(number)));
};

const asServings = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 1) {
    return 2;
  }

  return Math.max(1, Math.min(100, Math.round(number)));
};

const normalizeDifficulty = (value: unknown) => {
  if (typeof value !== "string") {
    return "Medium";
  }

  const key = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (key === "easy" || key === "facil") {
    return "Easy";
  }

  if (key === "hard" || key === "dificil") {
    return "Hard";
  }

  return "Medium";
};

const normalizeTag = (tag: string) => {
  const cleaned = tag
    .replace(/^#/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return DIETARY_TAGS[cleaned] ?? cleaned;
};

const uniqueTags = (tags: string[]) => {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const tag of tags) {
    const normalized = normalizeTag(tag).slice(0, 40);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
  }

  return unique.slice(0, 20);
};

export const parseRecipeDraft = (raw: string): RecipeDraft => {
  const record = asRecord(extractJsonObject(raw));
  if (!record) {
    throw new RecipeDraftParseError();
  }

  const clamp = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const parsed = recipeDraftSchema.safeParse({
    title: clamp(record.title, 160),
    description: clamp(record.description, 2000),
    cuisine: clamp(record.cuisine, 80),
    difficulty: normalizeDifficulty(record.difficulty),
    cookTime: asMinutes(record.cookTime),
    prepTime: asMinutes(record.prepTime),
    servings: asServings(record.servings),
    ingredients: asStringList(record.ingredients).map((item) =>
      item.slice(0, 240),
    ),
    instructions: asStringList(record.instructions).map((item) =>
      item.slice(0, 1000),
    ),
    tags: uniqueTags(asStringList(record.tags)),
  });

  if (!parsed.success) {
    throw new RecipeDraftParseError();
  }

  return parsed.data;
};
