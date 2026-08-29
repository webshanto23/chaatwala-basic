import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.workspace === "staff") return NextResponse.json({ error: "Customer address access only" }, { status: 403 });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.workspace === "staff") return NextResponse.json({ error: "Customer address access only" }, { status: 403 });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });

  const remaining = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    await prisma.address.update({
      where: { id: remaining[0].id },
      data: { isDefault: true },
    });
  }

  revalidateTag("user-address", "default");

  return NextResponse.json({ success: true });
}
