import assert from "node:assert/strict";
import { it } from "node:test";

import {
  createUser,
  describeDatabase,
  withRollback,
  type TestDb,
} from "@/server/test-db";
import { AiRateLimitError, consumeAiRateLimit } from "./rate-limit";

// A moment far from any real request, so rows already in the table (which
// are all newer) are outside every window.
const NOW = new Date(Date.UTC(2001, 0, 15, 12, 0, 0));
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const users = (tx: TestDb, count: number) =>
  Promise.all(Array.from({ length: count }, () => createUser(tx)));

const seed = (tx: TestDb, rows: { userId: string; createdAt: Date }[]) =>
  tx.aiRequest.createMany({ data: rows });

const rejected = (pattern: RegExp) => (error: unknown) =>
  error instanceof AiRateLimitError && pattern.test(error.message);

describeDatabase("AI rate limit in PostgreSQL", () => {
  it("limits one person to 12 requests an hour", async () => {
    await withRollback(async (tx) => {
      const [ada, grace] = await users(tx, 2);
      assert.ok(ada && grace);

      for (let attempt = 0; attempt < 12; attempt += 1) {
        await consumeAiRateLimit(tx, ada.id, NOW);
      }
      await assert.rejects(
        consumeAiRateLimit(tx, ada.id, NOW),
        rejected(/límite de peticiones de IA/),
      );
      // The refused request was not recorded, and others are unaffected
      assert.equal(await tx.aiRequest.count({ where: { userId: ada.id } }), 12);
      await consumeAiRateLimit(tx, grace.id, NOW);
    });
  });

  it("frees the personal limit as requests leave the hour", async () => {
    await withRollback(async (tx) => {
      const [ada] = await users(tx, 1);
      assert.ok(ada);
      await seed(
        tx,
        Array.from({ length: 12 }, (_, index) => ({
          userId: ada.id,
          createdAt: new Date(NOW.getTime() - HOUR + 5 * MINUTE + index * 1000),
        })),
      );

      await assert.rejects(
        consumeAiRateLimit(tx, ada.id, NOW),
        rejected(/límite de peticiones de IA/),
      );
      // Ten minutes later they are all more than an hour old
      await consumeAiRateLimit(
        tx,
        ada.id,
        new Date(NOW.getTime() + 10 * MINUTE),
      );
    });
  });

  it("limits the whole app to 18 requests a minute", async () => {
    await withRollback(async (tx) => {
      const everyone = await users(tx, 19);

      for (const user of everyone.slice(0, 18)) {
        await consumeAiRateLimit(tx, user.id, NOW);
      }
      await assert.rejects(
        consumeAiRateLimit(tx, everyone[18]!.id, NOW),
        rejected(/demasiadas peticiones/),
      );
      // A minute later the window has moved on
      await consumeAiRateLimit(
        tx,
        everyone[18]!.id,
        new Date(NOW.getTime() + MINUTE + 1),
      );
    });
  });

  it("limits the whole app to 40 requests a day", async () => {
    await withRollback(async (tx) => {
      const everyone = await users(tx, 8);
      const start = NOW.getTime() - 2 * HOUR;
      await seed(
        tx,
        Array.from({ length: 40 }, (_, attempt) => ({
          userId: everyone[attempt % 8]!.id,
          createdAt: new Date(start + attempt * 3 * MINUTE),
        })),
      );

      await assert.rejects(
        consumeAiRateLimit(tx, everyone[0]!.id, NOW),
        rejected(/límite diario/),
      );
      // The oldest request falls out of the day window
      await consumeAiRateLimit(
        tx,
        everyone[0]!.id,
        new Date(start + 24 * HOUR + 1),
      );
    });
  });

  it("does not count requests that are newer than the moment asked about", async () => {
    await withRollback(async (tx) => {
      const [ada] = await users(tx, 1);
      assert.ok(ada);
      await seed(
        tx,
        Array.from({ length: 12 }, () => ({
          userId: ada.id,
          createdAt: new Date(NOW.getTime() + MINUTE),
        })),
      );

      await consumeAiRateLimit(tx, ada.id, NOW);
    });
  });
});
