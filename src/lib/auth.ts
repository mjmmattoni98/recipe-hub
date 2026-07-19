import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";

const trustedOrigins = [env.BETTER_AUTH_URL].filter(
  (origin): origin is string => Boolean(origin),
);

export const auth = betterAuth({
  appName: "Recipe Hub",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : undefined,
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  rateLimit: {
    enabled: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  // Recipe Hub is invite-only: accounts are provisioned by an admin via
  // `pnpm tsx scripts/create-user.ts`, which authenticates with the
  // `x-admin-secret` header. Any other caller (i.e. the public sign-up
  // endpoint) is rejected here.
  databaseHooks: {
    user: {
      create: {
        before: async (_user, ctx) => {
          const providedSecret = ctx?.headers?.get("x-admin-secret");

          if (providedSecret !== env.BETTER_AUTH_SECRET) {
            throw new APIError("FORBIDDEN", {
              message:
                "Sign up is disabled. Contact an administrator to get an account created.",
            });
          }
        },
      },
    },
  },
});
