const USER_LIMIT = 12;
const USER_WINDOW_MS = 60 * 60 * 1000;
const MINUTE_LIMIT = 18;
const MINUTE_WINDOW_MS = 60 * 1000;
const DAY_LIMIT = 40;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;

const userHits = new Map<string, number[]>();
let minuteHits: number[] = [];
let dayHits: number[] = [];

export class AiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRateLimitError";
  }
}

const recent = (stamps: number[], now: number, windowMs: number) => {
  const cutoff = now - windowMs;
  return stamps.filter((stamp) => stamp >= cutoff);
};

export const resetAiRateLimits = () => {
  userHits.clear();
  minuteHits = [];
  dayHits = [];
};

export const consumeAiRateLimit = (userId: string, now = Date.now()) => {
  const nextDay = recent(dayHits, now, DAY_WINDOW_MS);
  if (nextDay.length >= DAY_LIMIT) {
    throw new AiRateLimitError(
      "Se ha alcanzado el límite diario de la IA gratuita. Vuelve a intentarlo mañana.",
    );
  }

  const nextMinute = recent(minuteHits, now, MINUTE_WINDOW_MS);
  if (nextMinute.length >= MINUTE_LIMIT) {
    throw new AiRateLimitError(
      "Hay demasiadas peticiones de IA en este momento. Espera un minuto.",
    );
  }

  const nextUser = recent(userHits.get(userId) ?? [], now, USER_WINDOW_MS);
  if (nextUser.length >= USER_LIMIT) {
    throw new AiRateLimitError(
      "Has alcanzado el límite de peticiones de IA por ahora. Inténtalo más tarde.",
    );
  }

  nextUser.push(now);
  nextMinute.push(now);
  nextDay.push(now);
  userHits.set(userId, nextUser);
  minuteHits = nextMinute;
  dayHits = nextDay;
};
