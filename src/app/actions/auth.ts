"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signUpSchema } from "@/lib/validations/auth";

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

  return { success: true, user: { id: user.id, email: user.email, name: user.name } };
}
