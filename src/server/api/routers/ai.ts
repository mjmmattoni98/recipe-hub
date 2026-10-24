import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  importSocialRecipe as importSocialRecipeFromUrl,
  SocialImportError,
} from "@/server/ai/import-social-recipe";
import { assertOpenRouterConfigured } from "@/server/ai/openrouter";
import { RecipeDraftParseError } from "@/server/ai/parse-recipe-draft";
import { AiRateLimitError, consumeAiRateLimit } from "@/server/ai/rate-limit";
import { answerRecipeQuestion } from "@/server/ai/recipe-assistant";
import { structureRecipeFromText } from "@/server/ai/recipe-draft";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const consumeUserAiQuota = (userId: string) => {
  try {
    consumeAiRateLimit(userId);
  } catch (error) {
    if (
      error instanceof AiRateLimitError ||
      (error instanceof Error && error.name === "AiRateLimitError")
    ) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: error.message,
      });
    }

    throw error;
  }
};

export const aiRouter = createTRPCRouter({
  structureRecipe: protectedProcedure
    .input(
      z.object({
        text: z.string().trim().min(20).max(12_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertOpenRouterConfigured();
      consumeUserAiQuota(ctx.session.user.id);

      try {
        return await structureRecipeFromText(input.text);
      } catch (error) {
        if (
          error instanceof RecipeDraftParseError ||
          (error instanceof Error && error.name === "RecipeDraftParseError")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw error;
      }
    }),

  askAboutRecipe: protectedProcedure
    .input(
      z.object({
        recipeId: z.string().min(1).max(64),
        question: z.string().trim().min(3).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertOpenRouterConfigured();

      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.recipeId },
        select: {
          title: true,
          description: true,
          cuisine: true,
          difficulty: true,
          cookTime: true,
          prepTime: true,
          servings: true,
          ingredients: true,
          instructions: true,
          tags: true,
        },
      });

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No se ha encontrado la receta.",
        });
      }

      consumeUserAiQuota(ctx.session.user.id);

      const answer = await answerRecipeQuestion(recipe, input.question);
      return { answer };
    }),

  importSocialRecipe: protectedProcedure
    .input(
      z.object({
        url: z.string().trim().min(8).max(2_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      consumeUserAiQuota(ctx.session.user.id);

      try {
        return await importSocialRecipeFromUrl(input.url);
      } catch (error) {
        if (
          error instanceof SocialImportError ||
          (error instanceof Error && error.name === "SocialImportError")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        if (
          error instanceof RecipeDraftParseError ||
          (error instanceof Error && error.name === "RecipeDraftParseError")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw error;
      }
    }),
});
