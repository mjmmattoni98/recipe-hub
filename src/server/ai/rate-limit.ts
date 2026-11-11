import type { Prisma } from "../../../generated/prisma/client";

const USER_LIMIT = 12;
const USER_WINDOW_MS = 60 * 60 * 1000;
const MINUTE_LIMIT = 18;
const MINUTE_WINDOW_MS = 60 * 1000;
const DAY_LIMIT = 40;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export class AiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRateLimitError";
  }
}

// How many requests were already made inside each window
export type AiRequestCounts = { user: number; minute: number; day: number };

// Returns the message to show when one more request would go over a limit
export const aiRateLimitMessage = (counts: AiRequestCounts) => {
  if (counts.day >= DAY_LIMIT) {
    return "Se ha alcanzado el límite diario de la IA gratuita. Vuelve a intentarlo mañana.";
  }
  if (counts.minute >= MINUTE_LIMIT) {
    return "Hay demasiadas peticiones de IA en este momento. Espera un minuto.";
  }
  if (counts.user >= USER_LIMIT) {
    return "Has alcanzado el límite de peticiones de IA por ahora. Inténtalo más tarde.";
  }
  return null;
};

// Any client works, including a transaction client
export type AiRateLimitDb = Pick<Prisma.TransactionClient, "aiRequest">;

// A soft guard: it counts, then records. Two requests at the same moment can
// both pass the count, which is fine for a cost limit.
export const consumeAiRateLimit = async (
  db: AiRateLimitDb,
  userId: string,
  now = new Date(),
) => {
  const countSince = (windowMs: number, forUser?: string) =>
    db.aiRequest.count({
      where: {
        ...(forUser ? { userId: forUser } : {}),
        createdAt: { gte: new Date(now.getTime() - windowMs), lte: now },
      },
    });

  const [user, minute, day] = await Promise.all([
    countSince(USER_WINDOW_MS, userId),
    countSince(MINUTE_WINDOW_MS),
    countSince(DAY_WINDOW_MS),
  ]);

  const message = aiRateLimitMessage({ user, minute, day });
  if (message) throw new AiRateLimitError(message);

  await db.aiRequest.create({ data: { userId, createdAt: now } });
};
