import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { getUnavailableCartItems } from "@/lib/store-availability";

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

  const unavailableItems = await getUnavailableCartItems(storeId, cart.items);

  return NextResponse.json({
    valid: unavailableItems.length === 0,
    unavailableItems,
  });
}
