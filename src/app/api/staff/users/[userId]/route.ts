import { NextResponse } from "next/server";
import { requirePermission, requireWorkspace, unauthorizedResponse } from "@/lib/authorize";
import prisma from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!(await requireWorkspace("staff")).authorized) return unauthorizedResponse("You do not have permission to view users");
  if (!(await requirePermission("user:view")).authorized) return unauthorizedResponse("You do not have permission to view users");
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, addresses: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const defaultAddress = user.addresses.find((address) => address.isDefault) ?? user.addresses[0] ?? null;
  return NextResponse.json({ user: { ...user, defaultAddress } });
}
