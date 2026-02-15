import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuth } from "better-auth";
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
});
