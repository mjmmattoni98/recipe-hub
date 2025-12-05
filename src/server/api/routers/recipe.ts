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

  toggleCooked: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      return ctx.db.recipe.update({
        where: { id: input.id },
        data: { cooked: !recipe.cooked },
        include: { videoSource: true },
      });
    }),
});
