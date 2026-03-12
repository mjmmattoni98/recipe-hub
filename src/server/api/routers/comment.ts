import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const commentRouter = createTRPCRouter({
  getCommentsByRecipeId: publicProcedure
    .input(z.object({ recipeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.comment.findMany({
        where: { recipeId: input.recipeId },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        content: z.string().min(1, "El comentario no puede estar vacío").max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.comment.create({
        data: {
          content: input.content,
          recipeId: input.recipeId,
          userId: ctx.session.user.id,
        },
      });
    }),
});
