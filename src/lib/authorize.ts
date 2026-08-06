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
import { can, canAny, type Permission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type PermissionCheckInput = {
  permissions: Permission | Permission[];
};

export async function authorize(input: PermissionCheckInput) {
  const session = await auth();

  // If there's no authenticated user, immediately return unauthorized.
  if (!session?.user) {
    return { authorized: false as const, session: null };
  }

  // Normalize stored permissions (may be undefined) to an array.
  const permissions = (session.user.permissions as Permission[]) ?? [];

  // Normalize required input into an array and check permissions.
  const required = Array.isArray(input.permissions) ? input.permissions : [input.permissions];
  // Authorized if any required permission is present or user has the wildcard '*'.
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
  // Enforce permission: return typed success with session on pass,
  // or a clear failure shape on deny.
  if (!result.authorized || !result.session?.user) {
    return { authorized: false, session: null };
  }
  return { authorized: true, session: result.session };
}
