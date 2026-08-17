import { NextResponse } from "next/server";
import { requireRole, authorize, unauthorizedResponse } from "@/lib/authorize";
import prisma from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { authorized: roleAuthorized } = await requireRole("admin");
  if (!roleAuthorized) {
    return unauthorizedResponse("You do not have permission to view users");
  }

  const { authorized } = await authorize({ permissions: ["user:view"] });
  if (!authorized) {
    return unauthorizedResponse("You do not have permission to view users");
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const defaultAddress = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      addresses: user.addresses,
      defaultAddress,
    },
  });
}
