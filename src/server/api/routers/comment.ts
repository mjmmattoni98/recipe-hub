import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const commentContentSchema = z
  .string()
  .min(1, "El comentario no puede estar vacío")
  .max(1000);

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
        content: commentContentSchema,
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

  updateComment: protectedProcedure
    .input(z.object({ id: z.string(), content: commentContentSchema }))
    .mutation(async ({ ctx, input }) => {
      const existingComment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (!existingComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.comment.update({
        where: { id: input.id },
        data: { content: input.content },
      });
    }),

  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingComment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (!existingComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.comment.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
