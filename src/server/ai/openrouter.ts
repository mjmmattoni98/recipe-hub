import "server-only";

import { env } from "@/env";
import { TRPCError } from "@trpc/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FREE_MODEL = "openrouter/free";
const TIMEOUT_MS = 45_000;

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type CompletionOptions = {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  jsonSchema?: {
    name: string;
    schema: object;
  };
};

type OpenRouterResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: {
    message?: string;
  };
};

const isTimeout = (error: unknown) =>
  error instanceof Error &&
  (error.name === "TimeoutError" || error.name === "AbortError");

const readContent = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (!part || typeof part !== "object" || !("text" in part)) {
        return "";
      }

      return typeof part.text === "string" ? part.text : "";
    })
    .join("");
};

export const assertOpenRouterConfigured = () => {
  if (!env.OPENROUTER_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "La IA no está configurada. Añade OPENROUTER_API_KEY en el servidor.",
    });
  }
};

const postCompletion = async (body: Record<string, unknown>) => {
  try {
    return await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.BETTER_AUTH_URL ?? "http://localhost:3000",
        "X-Title": "Recipe Hub",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (isTimeout(error)) {
      throw new TRPCError({
        code: "TIMEOUT",
        message: "El modelo gratuito tardó demasiado. Inténtalo de nuevo.",
      });
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No se pudo contactar con OpenRouter.",
    });
  }
};

const failForStatus = (status: number): never => {
  if (status === 429) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "OpenRouter ha limitado las peticiones gratuitas. Espera un poco e inténtalo de nuevo.",
    });
  }

  if (status === 401 || status === 403) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "La clave de OpenRouter no es válida.",
    });
  }

  if (status === 402) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "OpenRouter ha rechazado la petición gratuita.",
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "OpenRouter no pudo generar una respuesta.",
  });
};

export const completeWithFreeModel = async (options: CompletionOptions) => {
  assertOpenRouterConfigured();

  const body: Record<string, unknown> = {
    model: FREE_MODEL,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  };

  if (options.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: options.jsonSchema.name,
        strict: true,
        schema: options.jsonSchema.schema,
      },
    };
  }

  let response = await postCompletion(body);
  if (
    (response.status === 400 || response.status === 422) &&
    options.jsonSchema
  ) {
    const withoutSchema = { ...body };
    delete withoutSchema.response_format;
    response = await postCompletion(withoutSchema);
  }

  if (!response.ok) {
    failForStatus(response.status);
  }

  let data: OpenRouterResponse;
  try {
    data = (await response.json()) as OpenRouterResponse;
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "OpenRouter no pudo generar una respuesta.",
    });
  }
  if (data.error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "OpenRouter no pudo generar una respuesta.",
    });
  }

  const content = readContent(data.choices?.[0]?.message?.content).trim();
  if (!content) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "El modelo no devolvió texto.",
    });
  }

  return content;
};
