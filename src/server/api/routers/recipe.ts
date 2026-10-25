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
import { Prisma } from "../../../../generated/prisma/client";

// The filter panel only offers this many ingredient chips
const FACET_INGREDIENT_LIMIT = 12;

const recipeFilterInput = z.object({
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(50).default(12),
  searchQuery: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  difficulty: z.array(z.enum(["Easy", "Medium", "Hard"])).optional(),
  ingredients: z.array(z.string()).optional(),
  maxTotalTime: z.number().int().positive().optional(),
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

      // Two filters have no native Prisma operator: substring matching inside
      // the tags array, and comparing against prepTime + cookTime. Resolve
      // them to a set of ids with one raw query and fold that into the main
      // (fully typed) filtered/paginated query.
      const rawConditions: Prisma.Sql[] = [];
      if (filters.dietaryRestrictions?.length) {
        rawConditions.push(Prisma.sql`(
          SELECT bool_and(
            EXISTS (
              SELECT 1 FROM unnest(r."tags") AS tag
              WHERE tag ILIKE '%' || restriction || '%'
            )
          )
          FROM unnest(${filters.dietaryRestrictions}::text[]) AS restriction
        )`);
      }
      if (filters.maxTotalTime != null) {
        rawConditions.push(
          Prisma.sql`r."prepTime" + r."cookTime" <= ${filters.maxTotalTime}`,
        );
      }

      let rawMatchIds: string[] | undefined;
      if (rawConditions.length > 0) {
        const rows = await ctx.db.$queryRaw<{ id: string }[]>`
          SELECT r."id" FROM "Recipe" r
          WHERE ${Prisma.join(rawConditions, " AND ")}
        `;
        rawMatchIds = rows.map((row) => row.id);
      }

      const currentUserId = ctx.session?.user.id;

      const where: Prisma.RecipeWhereInput = {
        ...(filters.searchQuery
          ? { title: { contains: filters.searchQuery, mode: "insensitive" } }
          : {}),
        ...(filters.cuisine?.length
          ? { cuisine: { in: filters.cuisine } }
          : {}),
        ...(filters.difficulty?.length
          ? { difficulty: { in: filters.difficulty } }
          : {}),
        ...(filters.ingredients?.length
          ? { ingredients: { hasEvery: filters.ingredients } }
          : {}),
        ...(rawMatchIds ? { id: { in: rawMatchIds } } : {}),
        ...(filters.cookingStatus === "cooked" && currentUserId
          ? { cookedBy: { some: { userId: currentUserId } } }
          : {}),
        ...(filters.cookingStatus === "wantToTry" && currentUserId
          ? { cookedBy: { none: { userId: currentUserId } } }
          : {}),
      };

      // The total only changes with the filters, so count once on the first
      // page instead of on every "load more".
      const [recipes, total] = await Promise.all([
        ctx.db.recipe.findMany({
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
        }),
        filters.cursor ? undefined : ctx.db.recipe.count({ where }),
      ]);

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
        total,
      };
    }),

  getFilterFacets: publicProcedure.query(async ({ ctx }) => {
    const [cuisineRows, ingredientRows] = await Promise.all([
      ctx.db.recipe.findMany({
        distinct: ["cuisine"],
        select: { cuisine: true },
      }),
      ctx.db.$queryRaw<{ ingredient: string }[]>`
        SELECT ingredient
        FROM "Recipe" r, unnest(r."ingredients") AS ingredient
        GROUP BY ingredient
        ORDER BY COUNT(*) DESC, ingredient ASC
        LIMIT ${FACET_INGREDIENT_LIMIT}
      `,
    ]);

    return {
      cuisines: cuisineRows
        .map((row) => row.cuisine)
        .sort((a, b) => a.localeCompare(b)),
      ingredients: ingredientRows.map((row) => row.ingredient),
    };
  }),

  // Just what the menu planner's recipe picker shows
  getOptions: protectedProcedure.query(({ ctx }) => {
    return ctx.db.recipe.findMany({
      select: { id: true, title: true, image: true },
      orderBy: { title: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
        include: {
          videoSource: true,
          cookedBy: {
            where: { userId: ctx.session?.user.id ?? "" },
            select: { id: true },
          },
        },
      });

      if (!recipe) return null;

      const { cookedBy, ...rest } = recipe;
      return { ...rest, cookedByMe: cookedBy.length > 0 };
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
