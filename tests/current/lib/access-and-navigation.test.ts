import { describe, expect, it } from "vitest";
import { getRoleHome, getSafeReturnPath, getWorkspaceHome } from "@/lib/auth-redirect";
import { can, canAll, canAny } from "@/lib/permissions";
import { getVisibleStaffNavigation } from "@/features/staff-navigation/registry";

describe("current workspace and permission contract", () => {
  it("keeps return paths local and routes workspaces to their dedicated shells", () => {
    expect(getSafeReturnPath("/checkout")).toBe("/checkout");
    expect(getSafeReturnPath("//evil.example")).toBeNull();
    expect(getSafeReturnPath("https://evil.example")).toBeNull();
    expect(getWorkspaceHome("customer")).toBe("/profile/dashboard");
    expect(getWorkspaceHome("staff")).toBe("/staff");
    expect(getRoleHome("super_admin")).toBe("/staff");
  });

  it("uses permissions as capabilities and keeps Super Admin navigation separate", () => {
    expect(can(["food:view"], "food:view")).toBe(true);
    expect(canAny(["food:view"], ["store:view", "food:view"])).toBe(true);
    expect(canAll(["food:view"], ["food:view", "store:view"])).toBe(false);
    expect(can(["*"], "role:manage")).toBe(true);
    const staffLinks = getVisibleStaffNavigation(["food:view"], false).map((item) => item.href);
    expect(staffLinks).toContain("/staff/catalog/foods");
    expect(staffLinks).not.toContain("/staff/access/staff");
    expect(getVisibleStaffNavigation([], true).map((item) => item.href)).toContain("/staff/access/staff");
  });
});
