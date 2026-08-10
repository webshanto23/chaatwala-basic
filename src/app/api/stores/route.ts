import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      address: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ stores });
}
