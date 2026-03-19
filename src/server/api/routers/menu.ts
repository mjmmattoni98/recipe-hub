import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { subDays, addDays } from "date-fns";
import { TRPCError } from "@trpc/server";

export const menuRouter = createTRPCRouter({
  getWeeklyMenu: protectedProcedure
    .input(
      z.object({
        familyId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Lazy Deletion Strategy
      // 1. Delete all records older than 30 days ago
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      try {
        await ctx.db.menuSchedule.deleteMany({
          where: {
            date: {
              lt: thirtyDaysAgo,
            },
          },
        });
      } catch (err) {
        // Silently fail deletion if there is an issue, we still want to fetch
        console.error("Cleanup menu schedules failed:", err);
      }

      // 2. Verify current user belongs to the family
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
          code: "UNAUTHORIZED",
          message: "You do not belong to this family.",
        });
      }

      // 3. Fetch the requested range
      return ctx.db.menuSchedule.findMany({
        where: {
          familyId: input.familyId,
          date: {
            gte: subDays(input.startDate, 2),
            lte: addDays(input.endDate, 2),
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
        date: z.date(),
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
      })
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
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.db.menuSchedule.create({
        data: {
          familyId: input.familyId,
          recipeId: input.recipeId,
          date: input.date,
          mealType: input.mealType,
          userId: ctx.session.user.id,
        },
      });
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
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.db.menuSchedule.delete({
        where: { id: input.id },
      });
    }),
});
