import { z } from "zod";
import {
  canManageFamily,
  decideMemberRemoval,
  type MemberRemovalDecision,
} from "@/lib/family-permissions";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

const familyName = z.string().trim().min(1, "El nombre es obligatorio");

const REMOVAL_DENIED: Record<
  Extract<MemberRemovalDecision, { allowed: false }>["reason"],
  { code: "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST"; message: string }
> = {
  NOT_A_MEMBER: {
    code: "FORBIDDEN",
    message: "No perteneces a esta familia.",
  },
  NOT_ADMIN: {
    code: "FORBIDDEN",
    message: "Solo los administradores pueden quitar a otros miembros.",
  },
  TARGET_NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Esa persona no es miembro de esta familia.",
  },
  LAST_ADMIN: {
    code: "BAD_REQUEST",
    message:
      "Una familia necesita al menos un administrador. Elimina la familia en lugar de salir de ella.",
  },
};

export const familyRouter = createTRPCRouter({
  getMyFamilies: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.family.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  // Lists everyone so a family admin can pick who to add. Emails stay out of
  // this response: any signed-in user can call it.
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  createFamily: protectedProcedure
    .input(z.object({ name: familyName }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.family.create({
        data: {
          name: input.name,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "ADMIN",
            },
          },
        },
      });
    }),

  addMember: protectedProcedure
    .input(z.object({ familyId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify current user is an admin of the family
      const userMembership = await ctx.db.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: input.familyId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Solo los administradores de la familia pueden añadir miembros.",
        });
      }

      // Check if the user is already a member
      const existingMember = await ctx.db.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: input.familyId,
            userId: input.userId,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Esa persona ya es miembro de esta familia.",
        });
      }

      return ctx.db.familyMember.create({
        data: {
          familyId: input.familyId,
          userId: input.userId,
          role: "MEMBER",
        },
      });
    }),

  renameFamily: protectedProcedure
    .input(z.object({ familyId: z.string(), name: familyName }))
    .mutation(async ({ ctx, input }) => {
      await requireFamilyAdmin(
        ctx,
        input.familyId,
        "Solo los administradores de la familia pueden cambiarle el nombre.",
      );

      return ctx.db.family.update({
        where: { id: input.familyId },
        data: { name: input.name },
      });
    }),

  // Members and the family's scheduled menu go with it (onDelete: Cascade).
  deleteFamily: protectedProcedure
    .input(z.object({ familyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireFamilyAdmin(
        ctx,
        input.familyId,
        "Solo los administradores de la familia pueden eliminarla.",
      );

      return ctx.db.family.delete({ where: { id: input.familyId } });
    }),

  // An admin removes someone, or anyone removes themself (leaves).
  removeMember: protectedProcedure
    .input(z.object({ familyId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const members = await ctx.db.familyMember.findMany({
        where: { familyId: input.familyId },
        select: { userId: true, role: true },
      });

      const decision = decideMemberRemoval({
        members,
        actorId: ctx.session.user.id,
        targetId: input.userId,
      });
      if (!decision.allowed) {
        throw new TRPCError(REMOVAL_DENIED[decision.reason]);
      }

      await ctx.db.familyMember.deleteMany({
        where: { familyId: input.familyId, userId: input.userId },
      });

      return { familyId: input.familyId, userId: input.userId };
    }),
});

async function requireFamilyAdmin(
  ctx: {
    db: typeof db;
    session: { user: { id: string } };
  },
  familyId: string,
  message: string,
) {
  const membership = await ctx.db.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: ctx.session.user.id } },
    select: { role: true },
  });

  if (!canManageFamily(membership?.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
}
