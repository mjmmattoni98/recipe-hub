import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
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

  toggleCooked: protectedProcedure
    .input(z.object({ id: z.string(), cooked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recipe.update({
        where: { id: input.id },
        data: { cooked: input.cooked },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        cuisine: z.string(),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        cookTime: z.number().int().min(0),
        prepTime: z.number().int().min(0),
        servings: z.number().int().min(1),
        ingredients: z.array(z.string()),
        instructions: z.array(z.string()),
        image: z.string(),
        tags: z.array(z.string()),
        videoSource: z
          .object({
            platform: z.enum(["YouTube", "Instagram", "TikTok"]),
            url: z.string().url(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recipe.create({
        data: {
          title: input.title,
          description: input.description,
          cuisine: input.cuisine,
          difficulty: input.difficulty,
          cookTime: input.cookTime,
          prepTime: input.prepTime,
          servings: input.servings,
          ingredients: input.ingredients,
          instructions: input.instructions,
          image: input.image,
          tags: input.tags,
          videoSource: input.videoSource
            ? {
                create: input.videoSource,
              }
            : undefined,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string(),
        cuisine: z.string(),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        cookTime: z.number().int().min(0),
        prepTime: z.number().int().min(0),
        servings: z.number().int().min(1),
        ingredients: z.array(z.string()),
        instructions: z.array(z.string()),
        image: z.string(),
        tags: z.array(z.string()),
        videoSource: z
          .object({
            platform: z.enum(["YouTube", "Instagram", "TikTok"]),
            url: z.string().url(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First check if video source exists to decide whether to update or create
      const existingRecipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
        include: { videoSource: true },
      });

      if (!existingRecipe) {
        throw new Error("Recipe not found");
      }

      return ctx.db.recipe.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          cuisine: input.cuisine,
          difficulty: input.difficulty,
          cookTime: input.cookTime,
          prepTime: input.prepTime,
          servings: input.servings,
          ingredients: input.ingredients,
          instructions: input.instructions,
          image: input.image,
          tags: input.tags,
          videoSource: input.videoSource
            ? {
                upsert: {
                  create: input.videoSource,
                  update: input.videoSource,
                },
              }
            : existingRecipe.videoSource
              ? {
                  delete: true,
                }
              : undefined,
        },
      });
    }),
});
