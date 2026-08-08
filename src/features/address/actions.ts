"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addressSchema, type AddressInput } from "@/lib/validations/address";
import { revalidatePath, revalidateTag } from "next/cache";

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string | null;
  isDefault: boolean;
};

export async function getAddresses() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    addresses: addresses.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    })),
  };
}

export async function createAddress(input: AddressInput): Promise<
  | { success: true; address: Address }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.address.findFirst({
    where: { userId: session.user.id, isDefault: true },
  });

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      isDefault: existing ? false : true,
    },
  });

  revalidatePath("/profile/dashboard");
  revalidatePath("/cart");
  revalidateTag("user-address");

  return {
    success: true,
    address: {
      id: address.id,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    },
  };
}

export async function updateAddress(id: string, input: AddressInput): Promise<
  | { success: true; address: Address }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return { error: "Address not found" };
  }

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
    },
  });

  revalidatePath("/profile/dashboard");
  revalidatePath("/cart");
  revalidateTag("user-address");

  return {
    success: true,
    address: {
      id: address.id,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    },
  };
}

export async function deleteAddress(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return { error: "Address not found" };
  }

  await prisma.address.delete({ where: { id } });

  const remaining = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    await prisma.address.update({
      where: { id: remaining[0].id },
      data: { isDefault: true },
    });
  }

  revalidatePath("/profile/dashboard");
  revalidatePath("/cart");
  revalidateTag("user-address");

  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return { error: "Address not found" };
  }

  await prisma.address.updateMany({
    where: { userId: session.user.id },
    data: { isDefault: false },
  });

  await prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });

  revalidatePath("/profile/dashboard");
  revalidatePath("/cart");
  revalidateTag("user-address");

  return { success: true };
}
