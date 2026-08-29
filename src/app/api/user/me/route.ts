import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";

export async function GET() {
  const session = await auth();
  if (session?.user?.workspace === "staff") return NextResponse.json({ error: "Customer profile access only" }, { status: 403 });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await unstable_cache(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true },
      });

      if (!user) return null;

      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

      return {
        profile: {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          image: user.image ?? "",
          phone: defaultAddress?.phone ?? "",
        },
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
    },
    ["user-me", userId],
    { revalidate: 300, tags: ["user-profile", "user-address"] }
  )();

  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
