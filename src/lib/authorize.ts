/*
  authorize.ts

  Brief explanation:
  - This module provides helpers to check a user's permissions based on the
    session returned by `auth()`.
  - `authorize` fetches the current session and returns whether the user is
    authorized for one or more required permissions.
  - `requirePermission` is a convenience wrapper that enforces a permission
    and returns a typed success or failure result.
  - `unauthorizedResponse` produces a 403 JSON response for API routes.

  Key functions used:
  - auth(): obtains the current session (may be null).
  - can(permissions, permission): checks a single permission.
  - canAny(permissions, required[]): checks if any required permission is present.
*/

import { auth } from "@/lib/auth";
import { can, canAny, SUPER_ADMIN_SYSTEM_KEY, type Permission, type RoleName, type Workspace } from "@/lib/permissions";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type PermissionCheckInput = {
  permissions: Permission | Permission[];
};

type RoleCheckInput = {
  role: RoleName | RoleName[];
};

export async function authorize(input: PermissionCheckInput) {
  const session = await auth();

  if (!session?.user || !session.user.isActive) {
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

export function getUserRole(session: Session | null): RoleName | null {
  if (!session?.user?.role) {
    return null;
  }
  return session.user.role as RoleName;
}

export function getUserWorkspace(session: Session | null): Workspace | null {
  if (!session?.user?.workspace || !session.user.isActive) return null;
  return session.user.workspace;
}

export async function requireWorkspace(workspace: Workspace) {
  const session = await auth();
  if (!session?.user || !session.user.isActive || session.user.workspace !== workspace) {
    return { authorized: false as const, session: null };
  }
  return { authorized: true as const, session };
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.isActive || session.user.systemRoleKey !== SUPER_ADMIN_SYSTEM_KEY) {
    return { authorized: false as const, session: null };
  }
  return { authorized: true as const, session };
}

export async function authorizeRole(input: RoleCheckInput) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false as const, session: null, role: null };
  }

  const role = getUserRole(session);
  const required = Array.isArray(input.role) ? input.role : [input.role];
  const authorized = role ? required.includes(role) : false;

  return { authorized, session, role };
}

export async function requireRole(
  role: RoleName | RoleName[]
): Promise<{ authorized: true; session: Session; role: RoleName } | { authorized: false; session: null; role: null }> {
  const result = await authorizeRole({ role });
  if (!result.authorized || !result.session?.user) {
    return { authorized: false, session: null, role: null };
  }
  return { authorized: true, session: result.session, role: result.role! };
}
