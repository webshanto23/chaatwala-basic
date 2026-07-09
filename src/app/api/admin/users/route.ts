import { NextResponse } from "next/server";
import { authorize, unauthorizedResponse } from "@/lib/authorize";
import { logAction } from "@/app/actions/audit";
import prisma from "@/lib/prisma";

export async function GET() {
  const { authorized, session } = await authorize({ permissions: ["users:view"] });

  if (!authorized || !session?.user) {
    return unauthorizedResponse("You do not have permission to view users");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { authorized, session } = await authorize({ permissions: ["users:create"] });

  if (!authorized || !session?.user) {
    return unauthorizedResponse("You do not have permission to create users");
  }

  try {
    const body = await request.json();
    const { name, email, password, roleId } = body;

    const user = await prisma.user.create({
      data: { name, email, password, roleId },
      select: { id: true, name: true, email: true, roleId: true },
    });

    if (session.user.id) {
      await logAction({
        userId: session.user.id,
        action: "USER_CREATE",
        entity: "User",
        entityId: user.id,
        metadata: { email, roleId },
      });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
  }
}
