"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signUpSchema } from "@/lib/validations/auth";
import { generateToken, hashToken } from "@/lib/crypto";
import { sendVerificationEmail } from "@/lib/email";

const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = signUpSchema.parse(rawData);

  const hashedPassword = await bcrypt.hash(validated.password, 12);

  const userRole = await prisma.role.findUnique({
    where: { name: "user" },
    select: { id: true },
  });

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      roleId: userRole?.id,
    },
  });

  const token = generateToken();
  const hashedToken = await hashToken(token);
  const expires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: hashedToken,
      expires,
    },
  });

  await sendVerificationEmail(user.email, token);

  return { success: true, user: { id: user.id, email: user.email, name: user.name } };
}
