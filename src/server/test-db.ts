import { randomUUID } from "node:crypto";
import { after, describe } from "node:test";

import type { createTRPCContext } from "@/server/api/trpc";
import type { db as Database } from "@/server/db";
import type { Prisma } from "../../generated/prisma/client";

// Helpers for tests that need a real PostgreSQL database. Each test runs
// inside a transaction that is always rolled back, so nothing is left behind
// and nothing depends on rows that were already there.
//
// Never import routers or "@/server/db" at the top level of a database test
// file: they validate the environment on import, and the suites must still
// load (and skip) when DATABASE_URL is not set.

export type TestDb = Prisma.TransactionClient;
type TestContext = Awaited<ReturnType<typeof createTRPCContext>>;
export type TestUser = { id: string; role: string };

const hasDatabase = Boolean(process.env.DATABASE_URL);

export function describeDatabase(name: string, suite: () => void) {
  describe(
    name,
    { skip: hasDatabase ? false : "DATABASE_URL is not set" },
    () => {
      after(async () => {
        const { db } = await import("@/server/db");
        await db.$disconnect();
      });
      suite();
    },
  );
}

class Rollback extends Error {}

export async function withRollback(test: (tx: TestDb) => Promise<void>) {
  const { db } = await import("@/server/db");
  try {
    await db.$transaction(
      async (tx) => {
        await test(tx);
        throw new Rollback();
      },
      { maxWait: 10_000, timeout: 60_000 },
    );
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
}

export function createUser(tx: TestDb, role = "user") {
  const now = new Date();
  return tx.user.create({
    data: {
      name: "Test user",
      email: `${randomUUID()}@test.invalid`,
      emailVerified: true,
      role,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export function createRecipe(
  tx: TestDb,
  overrides: Partial<Prisma.RecipeUncheckedCreateInput> = {},
) {
  return tx.recipe.create({
    data: {
      title: "Test recipe",
      description: "Test",
      cuisine: "Test",
      difficulty: "Easy",
      cookTime: 10,
      prepTime: 5,
      servings: 2,
      ingredients: [],
      instructions: [],
      image: "https://example.invalid/test.jpg",
      tags: [],
      ...overrides,
    },
  });
}

// Routers bound to the transaction, signed in as `user` (or a guest)
export async function callersFor(tx: TestDb, user: TestUser | null) {
  const [{ recipeRouter }, { menuRouter }] = await Promise.all([
    import("@/server/api/routers/recipe"),
    import("@/server/api/routers/menu"),
  ]);
  const ctx = {
    db: tx as unknown as typeof Database,
    headers: new Headers(),
    session: user ? { user } : null,
  } as unknown as TestContext;

  return {
    recipe: recipeRouter.createCaller(ctx),
    menu: menuRouter.createCaller(ctx),
  };
}
