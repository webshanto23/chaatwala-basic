import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let guestId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestId = cookieStore.get("chaatwala_guest_id")?.value ?? null;
  }

  let cart;
  if (userId) {
    cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
  } else if (guestId) {
    cart = await prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });
  }

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ valid: true, unavailableItems: [] });
  }

  const body = await request.json().catch(() => ({}));
  const storeId = body?.storeId as string | undefined;

  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  const dishIds = cart.items
    .filter((item) => item.productType === "dish")
    .map((item) => item.productId);
  const drinkIds = cart.items
    .filter((item) => item.productType === "drink")
    .map((item) => item.productId);
  const comboIds = cart.items
    .filter((item) => item.productType === "combo")
    .map((item) => item.productId);

  const [dishes, drinks, combos] = await Promise.all([
    dishIds.length
      ? prisma.dish.findMany({
          where: { id: { in: dishIds }, storeId, isAvailable: true },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    drinkIds.length
      ? prisma.drink.findMany({
          where: { id: { in: drinkIds }, storeId, isAvailable: true },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    comboIds.length
      ? prisma.combo.findMany({
          where: { id: { in: comboIds }, storeId, isAvailable: true },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const availableIds = new Set([
    ...dishes.map((d) => d.id),
    ...drinks.map((d) => d.id),
    ...combos.map((c) => c.id),
  ]);

  const unavailableItems = cart.items
    .filter((item) => !availableIds.has(item.productId))
    .map((item) => ({
      productId: item.productId,
      productType: item.productType,
      name: item.name,
    }));

  return NextResponse.json({
    valid: unavailableItems.length === 0,
    unavailableItems,
  });
}
