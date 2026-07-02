import { describe, it, expect } from "vitest";
import { hasPermission, type RoleGrant } from "@/lib/auth/permissions";

describe("hasPermission", () => {
  it("global moderator can moderate content anywhere", () => {
    const grants: RoleGrant[] = [{ roleSlug: "moderator", topicId: null }];
    expect(hasPermission(grants, "content.moderate")).toBe(true);
    expect(hasPermission(grants, "content.moderate", { topicId: 5 })).toBe(true);
  });

  it("moderator cannot manage roles", () => {
    const grants: RoleGrant[] = [{ roleSlug: "moderator", topicId: null }];
    expect(hasPermission(grants, "role.manage")).toBe(false);
  });

  it("admin can manage roles and moderate", () => {
    const grants: RoleGrant[] = [{ roleSlug: "admin", topicId: null }];
    expect(hasPermission(grants, "role.manage")).toBe(true);
    expect(hasPermission(grants, "content.moderate", { topicId: 9 })).toBe(true);
  });

  it("maintainer can moderate only within its topic scope", () => {
    const grants: RoleGrant[] = [{ roleSlug: "maintainer", topicId: 7 }];
    expect(hasPermission(grants, "content.moderate", { topicId: 7 })).toBe(true);
    expect(hasPermission(grants, "content.moderate", { topicId: 8 })).toBe(false);
    // bağlam belirsizse (topicId yok) kapsamlı yetki uygulanmaz
    expect(hasPermission(grants, "content.moderate")).toBe(false);
  });

  it("status/community roles grant no permissions", () => {
    const grants: RoleGrant[] = [
      { roleSlug: "mentor", topicId: null },
      { roleSlug: "contributor", topicId: null },
    ];
    expect(hasPermission(grants, "content.moderate", { topicId: 1 })).toBe(false);
    expect(hasPermission(grants, "role.manage")).toBe(false);
  });

  it("no grants → no permission", () => {
    expect(hasPermission([], "content.moderate")).toBe(false);
  });

  it("unknown role slug is ignored", () => {
    const grants: RoleGrant[] = [{ roleSlug: "wizard", topicId: null }];
    expect(hasPermission(grants, "content.moderate")).toBe(false);
  });
});
