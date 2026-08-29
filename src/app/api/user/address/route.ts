import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";
import { unstable_cache, revalidateTag } from "next/cache";

export async function GET() {
  const session = await auth();
  if (session?.user?.workspace === "staff") return NextResponse.json({ error: "Customer address access only" }, { status: 403 });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await unstable_cache(
    async () => {
      return prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    },
    ["user-addresses", userId],
    { revalidate: 300, tags: ["user-address"] }
  )();

  return NextResponse.json({
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
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.workspace === "staff") return NextResponse.json({ error: "Customer address access only" }, { status: 403 });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.address.findFirst({
    where: { userId, isDefault: true },
  });

  const address = await prisma.address.create({
    data: {
      userId,
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

  revalidateTag("user-address", "default");

  return NextResponse.json({
    address: {
      id: address.id,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
    },
  });
}
