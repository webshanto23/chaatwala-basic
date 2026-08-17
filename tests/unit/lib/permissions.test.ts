import { describe, it, expect } from "vitest";
import { can, canAny, canAll, createCan, USER_PERMISSIONS, ADMIN_PERMISSIONS, STORE_MANAGER_PERMISSIONS, ROLE_PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions";

describe("permissions", () => {
  describe("can", () => {
    it("returns false for empty permissions", () => {
      expect(can([], "food:view")).toBe(false);
    });

    it("returns false for null/undefined permissions", () => {
      expect(can(null as unknown as string[], "food:view")).toBe(false);
      expect(can(undefined as unknown as string[], "food:view")).toBe(false);
    });

    it("returns true when permission is present", () => {
      expect(can(["food:view"], "food:view")).toBe(true);
    });

    it("returns false when permission is absent", () => {
      expect(can(["food:create"], "food:view")).toBe(false);
    });

    it("returns true for wildcard permission", () => {
      expect(can(["*"], "anything")).toBe(true);
    });

    it("returns true for admin:access from admin permissions", () => {
      expect(can(ADMIN_PERMISSIONS, "admin:access")).toBe(true);
    });

    it("returns true for store:view from store manager permissions", () => {
      expect(can(STORE_MANAGER_PERMISSIONS, "store:view")).toBe(true);
    });

    it("returns true for user:access from user permissions", () => {
      expect(can(USER_PERMISSIONS, "user:access")).toBe(true);
    });
  });

  describe("canAny", () => {
    it("returns false for empty permissions", () => {
      expect(canAny([], ["food:view", "food:create"])).toBe(false);
    });

    it("returns true when any required permission is present", () => {
      expect(canAny(["food:view"], ["food:view", "food:create"])).toBe(true);
    });

    it("returns false when none of the required permissions are present", () => {
      expect(canAny(["order:create"], ["food:view", "food:create"])).toBe(false);
    });

    it("returns true for wildcard permission", () => {
      expect(canAny(["*"], ["anything"])).toBe(true);
    });

    it("returns true when one of multiple required permissions matches", () => {
      expect(canAny(["user:access"], ["user:access", "admin:access"])).toBe(true);
    });
  });

  describe("canAll", () => {
    it("returns false for empty permissions", () => {
      expect(canAll([], ["food:view", "food:create"])).toBe(false);
    });

    it("returns true when all required permissions are present", () => {
      expect(canAll(["food:view", "food:create"], ["food:view", "food:create"])).toBe(true);
    });

    it("returns false when one required permission is missing", () => {
      expect(canAll(["food:view"], ["food:view", "food:create"])).toBe(false);
    });

    it("returns true for wildcard permission", () => {
      expect(canAll(["*"], ["anything"])).toBe(true);
    });
  });

  describe("createCan", () => {
    it("returns bound checker with can, canAny, canAll", () => {
      const checker = createCan(["food:view", "food:create"]);
      expect(checker.can("food:view")).toBe(true);
      expect(checker.canAny(["food:view", "food:delete"])).toBe(true);
      expect(checker.canAll(["food:view", "food:create"])).toBe(true);
      expect(checker.can("food:delete")).toBe(false);
    });
  });

  describe("role constants", () => {
    it("user permissions do not include admin:access", () => {
      expect(USER_PERMISSIONS).not.toContain("admin:access");
    });

    it("admin permissions include admin:access", () => {
      expect(ADMIN_PERMISSIONS).toContain("admin:access");
    });

    it("store manager permissions include store:view and order:update", () => {
      expect(STORE_MANAGER_PERMISSIONS).toContain("store:view");
      expect(STORE_MANAGER_PERMISSIONS).toContain("order:update");
      expect(STORE_MANAGER_PERMISSIONS).not.toContain("admin:access");
    });

    it("all permissions list contains unique entries", () => {
      const unique = new Set(ALL_PERMISSIONS);
      expect(unique.size).toBe(ALL_PERMISSIONS.length);
    });
  });
});
