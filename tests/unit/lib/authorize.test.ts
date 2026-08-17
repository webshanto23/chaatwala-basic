import { describe, it, expect, vi } from "vitest";
import { authorize, requirePermission, unauthorizedResponse } from "@/lib/authorize";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

describe("authorize", () => {
  it("returns unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const result = await authorize({ permissions: "admin:access" });
    expect(result.authorized).toBe(false);
    expect(result.session).toBeNull();
  });

  it("returns authorized when session has required permission", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["admin:access"],
      },
    } as any);
    const result = await authorize({ permissions: "admin:access" });
    expect(result.authorized).toBe(true);
    expect(result.session?.user.id).toBe("user_1");
  });

  it("returns authorized when session has wildcard permission", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["*"],
      },
    } as any);
    const result = await authorize({ permissions: "anything" });
    expect(result.authorized).toBe(true);
  });

  it("returns unauthorized when session lacks required permission", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["user:access"],
      },
    } as any);
    const result = await authorize({ permissions: "admin:access" });
    expect(result.authorized).toBe(false);
    expect(result.session?.user.id).toBe("user_1");
  });

  it("handles array of required permissions with canAny", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["food:view"],
      },
    } as any);
    const result = await authorize({ permissions: ["food:view", "food:create"] });
    expect(result.authorized).toBe(true);
  });

  it("returns unauthorized when none of multiple required permissions match", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["order:create"],
      },
    } as any);
    const result = await authorize({ permissions: ["food:view", "food:create"] });
    expect(result.authorized).toBe(false);
  });

  it("normalizes undefined permissions to empty array", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: undefined,
      },
    } as any);
    const result = await authorize({ permissions: "admin:access" });
    expect(result.authorized).toBe(false);
  });
});

describe("requirePermission", () => {
  it("returns success with session when authorized", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["admin:access"],
      },
    } as any);
    const result = await requirePermission("admin:access");
    expect(result.authorized).toBe(true);
    expect(result.session?.user.id).toBe("user_1");
  });

  it("returns failure when unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user_1",
        permissions: ["user:access"],
      },
    } as any);
    const result = await requirePermission("admin:access");
    expect(result.authorized).toBe(false);
    expect(result.session).toBeNull();
  });

  it("returns failure when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const result = await requirePermission("admin:access");
    expect(result.authorized).toBe(false);
    expect(result.session).toBeNull();
  });
});

describe("unauthorizedResponse", () => {
  it("returns 403 JSON response with default message", () => {
    const response = unauthorizedResponse();
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(403);
  });

  it("returns 403 JSON response with custom message", async () => {
    const response = unauthorizedResponse("Custom forbidden");
    const body = await response.json();
    expect(body.error).toBe("Custom forbidden");
    expect(response.status).toBe(403);
  });
});
