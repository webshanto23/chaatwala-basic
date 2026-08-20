import { describe, expect, it } from "vitest";
import { getRoleHome, getSafeReturnPath } from "@/lib/auth-redirect";

describe("getSafeReturnPath", () => {
  it("accepts local application paths", () => {
    expect(getSafeReturnPath("/cart")).toBe("/cart");
  });

  it("rejects external and protocol-relative paths", () => {
    expect(getSafeReturnPath("https://example.com")).toBeNull();
    expect(getSafeReturnPath("//example.com")).toBeNull();
  });
});

describe("getRoleHome", () => {
  it("returns the appropriate role landing path", () => {
    expect(getRoleHome("admin")).toBe("/admin/dashboard");
    expect(getRoleHome("store_manager")).toBe("/store-manager/dashboard");
    expect(getRoleHome("user")).toBe("/profile/dashboard");
  });
});
