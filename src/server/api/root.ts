import { commentRouter } from "@/server/api/routers/comment";
import { familyRouter } from "@/server/api/routers/family";
import { menuRouter } from "@/server/api/routers/menu";
import { recipeRouter } from "@/server/api/routers/recipe";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  recipe: recipeRouter,
  family: familyRouter,
  comment: commentRouter,
  menu: menuRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
