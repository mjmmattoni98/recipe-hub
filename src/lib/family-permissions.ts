export type FamilyRole = "ADMIN" | "MEMBER";

export type FamilyMembership = { userId: string; role: FamilyRole };

export type MemberRemovalDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "NOT_A_MEMBER" | "NOT_ADMIN" | "TARGET_NOT_FOUND" | "LAST_ADMIN";
    };

/** Renaming and deleting a family is for its admins only. */
export function canManageFamily(role: FamilyRole | null | undefined) {
  return role === "ADMIN";
}

/**
 * Whether `actorId` may remove `targetId` from a family whose full member list
 * is `members`. An admin can remove anyone; anyone can remove themself
 * (leaving). A family always keeps at least one admin. The checks run in this
 * order so that a non-admin can't probe who belongs to the family.
 */
export function decideMemberRemoval({
  members,
  actorId,
  targetId,
}: Readonly<{
  members: readonly FamilyMembership[];
  actorId: string;
  targetId: string;
}>): MemberRemovalDecision {
  const actor = members.find((member) => member.userId === actorId);
  if (!actor) return { allowed: false, reason: "NOT_A_MEMBER" };

  if (actorId !== targetId && !canManageFamily(actor.role)) {
    return { allowed: false, reason: "NOT_ADMIN" };
  }

  const target = members.find((member) => member.userId === targetId);
  if (!target) return { allowed: false, reason: "TARGET_NOT_FOUND" };

  if (target.role === "ADMIN") {
    const admins = members.filter((member) => member.role === "ADMIN");
    if (admins.length <= 1) return { allowed: false, reason: "LAST_ADMIN" };
  }

  return { allowed: true };
}
