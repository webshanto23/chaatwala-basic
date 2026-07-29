import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const address = await prisma.address.findFirst({
    where: { userId, isDefault: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name ?? "",
      email: user.email,
      image: user.image ?? "",
    },
    phone: address?.phone ?? "",
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, image } = body as { name?: string; image?: string };

  if (!name && !image) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ?? user.name,
      image: image ?? user.image,
    },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json({
    user: {
      id: updatedUser.id,
      name: updatedUser.name ?? "",
      email: updatedUser.email,
      image: updatedUser.image ?? "",
    },
  });
}