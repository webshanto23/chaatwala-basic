import { auth } from "@/lib/auth";
import { can, canAny, type Permission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type PermissionCheckInput = {
  permissions: Permission | Permission[];
};

export async function authorize(input: PermissionCheckInput) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false as const, session: null };
  }

  const permissions = (session.user.permissions as Permission[]) ?? [];

  const required = Array.isArray(input.permissions) ? input.permissions : [input.permissions];
  const authorized = canAny(permissions, required) || can(permissions, "*");

  return { authorized: authorized as boolean, session };
}

export function unauthorizedResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requirePermission(
  permission: Permission | Permission[]
): Promise<{ authorized: true; session: Session } | { authorized: false; session: null }> {
  const result = await authorize({ permissions: permission });
  if (!result.authorized || !result.session?.user) {
    return { authorized: false, session: null };
  }
  return { authorized: true, session: result.session };
}
