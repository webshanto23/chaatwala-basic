import { auth } from "@/lib/auth";
import { can, canAny, type Permission } from "@/lib/permissions";
import { NextResponse } from "next/server";

type PermissionCheckInput = {
  permissions: Permission | Permission[];
};

export async function authorize(input: PermissionCheckInput) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false as const, session: null };
  }

  const permissions = (session.user.permissions as Permission[]) ?? [];

  if (session.user.role === "super_admin") {
    return { authorized: true as const, session };
  }

  const required = Array.isArray(input.permissions) ? input.permissions : [input.permissions];
  const authorized = canAny(permissions, required) || can(permissions, "*");

  return { authorized: authorized as boolean, session };
}

export function unauthorizedResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
