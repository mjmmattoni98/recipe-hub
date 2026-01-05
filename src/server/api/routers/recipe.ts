import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const recipeRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.recipe.findMany({
      include: {
        videoSource: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.recipe.findUnique({
        where: { id: input.id },
        include: {
          videoSource: true,
        },
      });
    }),
});
