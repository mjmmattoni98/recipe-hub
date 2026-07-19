import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  deleteRecipeImage,
  resolveRecipeImageUrl,
} from "@/server/recipe-image";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma/client";

const recipeFilterInput = z.object({
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(50).default(12),
  searchQuery: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  difficulty: z.array(z.enum(["Easy", "Medium", "Hard"])).optional(),
  ingredients: z.array(z.string()).optional(),
  maxCookTime: z.number().int().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cookingStatus: z.enum(["all", "cooked", "wantToTry"]).optional(),
});

const recipeInputSchema = z.object({
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
      url: z.url(),
    })
    .optional(),
});

export const recipeRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(recipeFilterInput)
    .query(async ({ ctx, input: filters }) => {
      const limit = filters.limit;

      // Substring matching against a String[] column (tags) has no native
      // Prisma operator, so resolve it to a set of ids via one raw query
      // and fold that into the main (fully typed) filtered/paginated query.
      let dietaryMatchIds: string[] | undefined;
      if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0) {
        const rows = await ctx.db.$queryRaw<{ id: string }[]>`
          SELECT r."id" FROM "Recipe" r
          WHERE (
            SELECT bool_and(
              EXISTS (
                SELECT 1 FROM unnest(r."tags") AS tag
                WHERE tag ILIKE '%' || restriction || '%'
              )
            )
            FROM unnest(${filters.dietaryRestrictions}::text[]) AS restriction
          )
        `;
        dietaryMatchIds = rows.map((row) => row.id);
      }

      const currentUserId = ctx.session?.user.id;

      const where: Prisma.RecipeWhereInput = {
        ...(filters.searchQuery
          ? { title: { contains: filters.searchQuery, mode: "insensitive" } }
          : {}),
        ...(filters.cuisine?.length ? { cuisine: { in: filters.cuisine } } : {}),
        ...(filters.difficulty?.length
          ? { difficulty: { in: filters.difficulty } }
          : {}),
        ...(filters.ingredients?.length
          ? { ingredients: { hasEvery: filters.ingredients } }
          : {}),
        ...(filters.maxCookTime != null
          ? { cookTime: { lte: filters.maxCookTime } }
          : {}),
        ...(dietaryMatchIds ? { id: { in: dietaryMatchIds } } : {}),
        ...(filters.cookingStatus === "cooked" && currentUserId
          ? { cookedBy: { some: { userId: currentUserId } } }
          : {}),
        ...(filters.cookingStatus === "wantToTry" && currentUserId
          ? { cookedBy: { none: { userId: currentUserId } } }
          : {}),
      };

      const recipes = await ctx.db.recipe.findMany({
        where,
        take: limit + 1,
        ...(filters.cursor
          ? { cursor: { id: filters.cursor }, skip: 1 }
          : {}),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          videoSource: true,
          cookedBy: {
            where: { userId: currentUserId ?? "" },
            select: { id: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (recipes.length > limit) {
        const nextItem = recipes.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: recipes.map(({ cookedBy, ...recipe }) => ({
          ...recipe,
          cookedByMe: cookedBy.length > 0,
        })),
        nextCursor,
      };
    }),

  getFilterFacets: publicProcedure.query(async ({ ctx }) => {
    const recipes = await ctx.db.recipe.findMany({
      select: { cuisine: true, ingredients: true },
    });

    const cuisines = [...new Set(recipes.map((recipe) => recipe.cuisine))].sort(
      (a, b) => a.localeCompare(b),
    );

    const ingredientCounts = new Map<string, number>();
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        ingredientCounts.set(
          ingredient,
          (ingredientCounts.get(ingredient) ?? 0) + 1,
        );
      }
    }

    const ingredients = [...ingredientCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([ingredient]) => ingredient);

    return { cuisines, ingredients };
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

  toggleCookedByMe: protectedProcedure
    .input(z.object({ id: z.string(), cooked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.cooked) {
        await ctx.db.recipeCook.upsert({
          where: {
            recipeId_userId: {
              recipeId: input.id,
              userId: ctx.session.user.id,
            },
          },
          create: { recipeId: input.id, userId: ctx.session.user.id },
          update: {},
        });
      } else {
        await ctx.db.recipeCook.deleteMany({
          where: { recipeId: input.id, userId: ctx.session.user.id },
        });
      }

      return { success: true };
    }),

  create: protectedProcedure
    .input(recipeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const resolvedImage = await resolveRecipeImageUrl(input.image);

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
          image: resolvedImage,
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
    .input(recipeInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resolvedImage = await resolveRecipeImageUrl(input.image);

      // First check if video source exists to decide whether to update or create
      const existingRecipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
        include: { videoSource: true },
      });

      if (!existingRecipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receta no encontrada",
        });
      }

      const updatedRecipe = await ctx.db.recipe.update({
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
          image: resolvedImage,
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

      if (existingRecipe.image !== resolvedImage) {
        const usagesOfPreviousImage = await ctx.db.recipe.count({
          where: {
            image: existingRecipe.image,
            NOT: {
              id: input.id,
            },
          },
        });

        if (usagesOfPreviousImage === 0) {
          await deleteRecipeImage(existingRecipe.image).catch((error) => {
            console.error("Failed to delete previous recipe image", error);
          });
        }
      }

      return updatedRecipe;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingRecipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
      });

      if (!existingRecipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receta no encontrada",
        });
      }

      await ctx.db.recipe.delete({
        where: { id: input.id },
      });

      const usagesOfDeletedImage = await ctx.db.recipe.count({
        where: {
          image: existingRecipe.image,
        },
      });

      if (usagesOfDeletedImage === 0) {
        await deleteRecipeImage(existingRecipe.image).catch((error) => {
          console.error("Failed to delete recipe image", error);
        });
      }

      return {
        success: true,
      };
    }),
});
