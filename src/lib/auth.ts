import {
  isAppAdmin,
  MIN_PASSWORD_LENGTH,
  roleFromUnknown,
} from "@/lib/admin-role";
import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";

const trustedOrigins = [env.BETTER_AUTH_URL].filter(
  (origin): origin is string => Boolean(origin),
);

const LAST_ADMIN_MESSAGE = "Tiene que quedar al menos un administrador.";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readUserId(body: Record<string, unknown> | null): string | null {
  return typeof body?.userId === "string" ? body.userId : null;
}

function readRoleValue(value: unknown): string | null {
  if (typeof value === "string") return value;

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.join(",");
  }

  return null;
}

function roleFromEndpointContext(ctx: unknown): string | null {
  const context = asRecord(asRecord(ctx)?.context);
  const session = asRecord(context?.session);
  return roleFromUnknown(session?.user);
}

async function listActiveAdminIds() {
  const users = await db.user.findMany({
    where: { role: { contains: "admin" } },
    select: { id: true, role: true, banned: true },
  });

  return users
    .filter((user) => isAppAdmin(user.role) && !user.banned)
    .map((user) => user.id);
}

async function assertActiveAdminRemains(
  userId: string,
  change: { role?: string; banned?: boolean; deleted?: boolean },
) {
  const activeAdminIds = await listActiveAdminIds();
  if (!activeAdminIds.includes(userId)) return;

  const staysActive =
    !change.deleted &&
    (change.role === undefined || isAppAdmin(change.role)) &&
    change.banned !== true;

  if (staysActive || activeAdminIds.length > 1) return;

  throw new APIError("BAD_REQUEST", {
    message: LAST_ADMIN_MESSAGE,
  });
}

export const auth = betterAuth({
  appName: "Recipe Hub",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : undefined,
  plugins: [admin()],
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  rateLimit: {
    enabled: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/admin/create-user") {
        const password = asRecord(ctx.body)?.password;
        if (
          typeof password !== "string" ||
          password.length < MIN_PASSWORD_LENGTH
        ) {
          throw new APIError("BAD_REQUEST", {
            message: "La contraseña debe tener al menos 8 caracteres.",
          });
        }
        return;
      }

      if (ctx.path === "/admin/set-role") {
        const body = asRecord(ctx.body);
        const userId = readUserId(body);
        const role = readRoleValue(body?.role);
        if (!userId || role === null) return;
        await assertActiveAdminRemains(userId, { role });
        return;
      }

      if (ctx.path === "/admin/update-user") {
        const body = asRecord(ctx.body);
        const userId = readUserId(body);
        const data = asRecord(body?.data);
        if (!userId || !data) return;

        const role = Object.prototype.hasOwnProperty.call(data, "role")
          ? (readRoleValue(data.role) ?? undefined)
          : undefined;
        const banned =
          typeof data.banned === "boolean" ? data.banned : undefined;
        if (role === undefined && banned === undefined) return;

        await assertActiveAdminRemains(userId, { role, banned });
        return;
      }

      if (ctx.path === "/admin/remove-user") {
        const userId = readUserId(asRecord(ctx.body));
        if (!userId) return;
        await assertActiveAdminRemains(userId, { deleted: true });
        return;
      }

      if (ctx.path === "/admin/ban-user") {
        const userId = readUserId(asRecord(ctx.body));
        if (!userId) return;
        await assertActiveAdminRemains(userId, { banned: true });
      }
    }),
  },
  // Public sign-up stays closed. Accounts are created by an app admin, or by
  // `pnpm tsx scripts/create-user.ts`, which sends `x-admin-secret`.
  databaseHooks: {
    user: {
      create: {
        before: async (_user, ctx) => {
          const providedSecret = ctx?.headers?.get("x-admin-secret");
          if (providedSecret === env.BETTER_AUTH_SECRET) return;

          const sessionRole = roleFromEndpointContext(ctx);
          if (
            ctx?.path === "/admin/create-user" &&
            (sessionRole === null || isAppAdmin(sessionRole))
          ) {
            return;
          }

          throw new APIError("FORBIDDEN", {
            message:
              "Sign up is disabled. Contact an administrator to get an account created.",
          });
        },
      },
      delete: {
        before: async (user) => {
          await assertActiveAdminRemains(user.id, { deleted: true });
        },
      },
    },
  },
});
