import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canManageFamily,
  decideMemberRemoval,
  type FamilyMembership,
} from "./family-permissions";

const admin: FamilyMembership = { userId: "admin", role: "ADMIN" };
const otherAdmin: FamilyMembership = { userId: "admin-2", role: "ADMIN" };
const ana: FamilyMembership = { userId: "ana", role: "MEMBER" };
const luis: FamilyMembership = { userId: "luis", role: "MEMBER" };

describe("canManageFamily", () => {
  it("is true only for admins", () => {
    assert.equal(canManageFamily("ADMIN"), true);
    assert.equal(canManageFamily("MEMBER"), false);
    assert.equal(canManageFamily(null), false);
    assert.equal(canManageFamily(undefined), false);
  });
});

describe("decideMemberRemoval", () => {
  it("lets an admin remove a member", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana, luis],
        actorId: "admin",
        targetId: "ana",
      }),
      { allowed: true },
    );
  });

  it("lets a member leave", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "ana",
        targetId: "ana",
      }),
      { allowed: true },
    );
  });

  it("rejects a member removing someone else", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana, luis],
        actorId: "ana",
        targetId: "luis",
      }),
      { allowed: false, reason: "NOT_ADMIN" },
    );
  });

  it("rejects a member removing an admin", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "ana",
        targetId: "admin",
      }),
      { allowed: false, reason: "NOT_ADMIN" },
    );
  });

  it("rejects someone who is not in the family", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "intruder",
        targetId: "ana",
      }),
      { allowed: false, reason: "NOT_A_MEMBER" },
    );
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "intruder",
        targetId: "intruder",
      }),
      { allowed: false, reason: "NOT_A_MEMBER" },
    );
  });

  it("reports a missing target to an admin", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "admin",
        targetId: "ghost",
      }),
      { allowed: false, reason: "TARGET_NOT_FOUND" },
    );
  });

  it("doesn't tell a non-admin whether a target exists", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "ana",
        targetId: "ghost",
      }),
      { allowed: false, reason: "NOT_ADMIN" },
    );
  });

  it("keeps the last admin: they can't leave", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, ana],
        actorId: "admin",
        targetId: "admin",
      }),
      { allowed: false, reason: "LAST_ADMIN" },
    );
  });

  it("keeps the last admin even when they are the only member", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin],
        actorId: "admin",
        targetId: "admin",
      }),
      { allowed: false, reason: "LAST_ADMIN" },
    );
  });

  it("lets an admin leave or be removed when another admin remains", () => {
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, otherAdmin, ana],
        actorId: "admin",
        targetId: "admin",
      }),
      { allowed: true },
    );
    assert.deepEqual(
      decideMemberRemoval({
        members: [admin, otherAdmin, ana],
        actorId: "admin-2",
        targetId: "admin",
      }),
      { allowed: true },
    );
  });
});
