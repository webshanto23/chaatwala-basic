import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unstable_cache, revalidateTag } from "next/cache";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await unstable_cache(
    async () => {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true },
      });
      if (!u) return null;
      const address = await prisma.address.findFirst({
        where: { userId, isDefault: true },
      });
      return {
        user: {
          id: u.id,
          name: u.name ?? "",
          email: u.email,
          image: u.image ?? "",
        },
        phone: address?.phone ?? "",
      };
    },
    ["user-profile", userId],
    { revalidate: 300, tags: ["user-profile"] }
  )();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
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

  revalidateTag("user-profile");

  return NextResponse.json({
    user: {
      id: updatedUser.id,
      name: updatedUser.name ?? "",
      email: updatedUser.email,
      image: updatedUser.image ?? "",
    },
  });
}