import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma/client";

// Parses a "yyyy-MM-dd" string as UTC midnight, matching how Postgres
// stores `@db.Date` columns (no timezone component). This must only be
// called with strings already validated by z.iso.date().
const parseDateOnly = (dateString: string) =>
  new Date(`${dateString}T00:00:00.000Z`);

export const menuRouter = createTRPCRouter({
  getWeeklyMenu: protectedProcedure
    .input(
      z.object({
        familyId: z.string(),
        startDate: z.iso.date(),
        endDate: z.iso.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify current user belongs to the family
      const membership = await ctx.db.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: input.familyId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No perteneces a esta familia.",
        });
      }

      return ctx.db.menuSchedule.findMany({
        where: {
          familyId: input.familyId,
          date: {
            gte: parseDateOnly(input.startDate),
            lte: parseDateOnly(input.endDate),
          },
        },
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              image: true,
              difficulty: true,
              cookTime: true,
              prepTime: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  scheduleRecipe: protectedProcedure
    .input(
      z.object({
        familyId: z.string(),
        recipeId: z.string(),
        date: z.iso.date(),
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: input.familyId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        return await ctx.db.menuSchedule.create({
          data: {
            familyId: input.familyId,
            recipeId: input.recipeId,
            date: parseDateOnly(input.date),
            mealType: input.mealType,
            userId: ctx.session.user.id,
          },
        });
      } catch (error) {
        // The same recipe can only be on a family's menu once per date and meal
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Esa receta ya está en el menú de esa comida.",
          });
        }
        throw error;
      }
    }),

  removeScheduledRecipe: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.menuSchedule.findUnique({
        where: { id: input.id },
      });

      if (!schedule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify membership
      const membership = await ctx.db.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: schedule.familyId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.menuSchedule.delete({
        where: { id: input.id },
      });
    }),
});
