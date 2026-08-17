import { describe, it, expect, vi } from "vitest";
import { getSession, requireAuth } from "@/features/auth/service";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

describe("auth service", () => {
  describe("getSession", () => {
    it("returns session when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1", email: "test@example.com" },
      } as any);
      const session = await getSession();
      expect(session?.user.id).toBe("user_1");
    });

    it("returns null when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const session = await getSession();
      expect(session).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("returns session when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1", email: "test@example.com" },
      } as any);
      const session = await requireAuth();
      expect(session.user.id).toBe("user_1");
    });

    it("throws when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });
  });
});
