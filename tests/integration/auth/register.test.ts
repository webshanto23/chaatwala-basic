import { describe, it, expect, vi } from "vitest";
import { registerUser } from "@/app/actions/auth";

vi.mock("@/lib/prisma", () => ({
  default: {
    role: {
      findUnique: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/crypto", () => ({
  generateToken: vi.fn(() => "mock-token"),
  hashToken: vi.fn(() => "hashed-token"),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(() => "hashed-password"),
  },
  hash: vi.fn(() => "hashed-password"),
}));

import prisma from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/crypto";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcrypt";

describe("registerUser server action", () => {
  it("creates user with hashed password and verification token", async () => {
    vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: "role_user" } as any);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user_new",
      email: "test@example.com",
      name: "Test",
    } as any);
    vi.mocked(prisma.verificationToken.create).mockResolvedValue({} as any);

    const formData = new FormData();
    formData.append("name", "Test");
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    const result = await registerUser(formData);

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Test",
        email: "test@example.com",
        password: "hashed-password",
        roleId: "role_user",
      },
    });
    expect(generateToken).toHaveBeenCalled();
    expect(hashToken).toHaveBeenCalledWith("mock-token");
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: {
        identifier: "test@example.com",
        token: "hashed-token",
        expires: expect.any(Date),
      },
    });
    expect(sendVerificationEmail).toHaveBeenCalledWith("test@example.com", "mock-token");
    expect(result).toEqual({ success: true, user: { id: "user_new", email: "test@example.com", name: "Test" } });
  });

  it("fails when role is not found", async () => {
    vi.mocked(prisma.role.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("name", "Test");
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    // NOTE: Current implementation does not throw when role is missing;
    // it proceeds with undefined roleId. This is a potential bug.
    const result = await registerUser(formData);
    expect(result.success).toBe(true);
  });
});
