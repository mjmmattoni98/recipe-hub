import { isAppAdmin, roleFromUnknown } from "@/lib/admin-role";

// Anyone signed in can edit (it is a shared cookbook), but only the author
// or an app admin can delete. A recipe with no author is admin-only.
export function canDeleteRecipe(
  user: { id: string; role?: string | null } | null | undefined,
  recipe: { createdById: string | null },
) {
  if (!user) return false;

  return (
    isAppAdmin(roleFromUnknown(user)) ||
    (recipe.createdById !== null && recipe.createdById === user.id)
  );
}
