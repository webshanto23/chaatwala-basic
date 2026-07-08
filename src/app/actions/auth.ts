"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signUpSchema } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth";

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = signUpSchema.parse(rawData);

  const hashedPassword = await bcrypt.hash(validated.password, 12);

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
    },
  });

  return { success: true, user: { id: user.id, email: user.email, name: user.name } };
}

export async function registerAndSignIn(formData: FormData): Promise<void> {
  const result = await registerUser(formData);
  if (!result.success) return;

  await signIn("credentials", {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    redirectTo: "/profile/dashboard",
  });
}
