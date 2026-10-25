"use client";

import { api, type RouterOutputs } from "@/trpc/react";
import {
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { toast } from "sonner";

type RecipeListData = InfiniteData<RouterOutputs["recipe"]["getAll"]>;

// Lists filtered by cooking status change membership when a recipe flips,
// so only those need a refetch; every other list is already correct after
// the optimistic update.
const isFilteredByCookingStatus = (queryKey: QueryKey) => {
  const meta = queryKey[1] as
    | { input?: { cookingStatus?: string } }
    | undefined;
  const status = meta?.input?.cookingStatus;
  return status === "cooked" || status === "wantToTry";
};

export function useToggleCooked() {
  const queryClient = useQueryClient();
  const listKey = getQueryKey(api.recipe.getAll, undefined, "infinite");

  return api.recipe.toggleCookedByMe.useMutation({
    onMutate: async ({ id, cooked }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueriesData<RecipeListData>({
        queryKey: listKey,
      });

      queryClient.setQueriesData<RecipeListData>(
        { queryKey: listKey },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === id ? { ...item, cookedByMe: cooked } : item,
              ),
            })),
          },
      );

      return { previous };
    },
    onError: (error, _input, context) => {
      for (const [queryKey, data] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      toast.error(error.message);
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: listKey,
        predicate: (query) => isFilteredByCookingStatus(query.queryKey),
      }),
  });
}
