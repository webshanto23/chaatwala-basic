// ============================================================================
// ROLE / PERMISSION CONTRACT
// ============================================================================
// ROLE answers: "Which workspace can you enter?"
//   customer roles  -> Customer application
//   staff roles     -> Staff application
//
// PERMISSION answers: "What can you do once you're there?"
//   Permissions are capability checks ONLY.
//   Do NOT use permissions to infer roles.
//   Do NOT add permissions that merely identify a role.
// ============================================================================

// A Permission is represented as a simple string, e.g. "food:view".
export type Permission = string;

// Role names are database-managed. Code only recognizes protected system-role keys.
export type RoleName = string;
export type Workspace = "customer" | "staff";
export const SUPER_ADMIN_SYSTEM_KEY = "super_admin";

// Permissions granted to a regular user.
export const USER_PERMISSIONS = [
  "order:create",
  "payment:create",
  "food:view",
] as const;

export const SUPER_ADMIN_PERMISSIONS = [
  "staff:manage",
  "role:manage",
  "permission:manage",
  "store:assign",
  "audit:view",
  "user:view",
  "food:view",
  "food:create",
  "food:update",
  "food:delete",
  "food-category:manage",
  "food-tag:manage",
  "store:view",
  "store:create",
  "store:update",
  "store:delete",
  "order:view",
  "order:update",
] as const;

// Permissions granted to an admin user.
export const ADMIN_PERMISSIONS = [
  "user:access",
  "user:view",
  "user:updateRole",
  "user:delete",
  "food:view",
  "food:create",
  "food:update",
  "food:delete",
  "food-category:manage",
  "food-tag:manage",
  "role:manage",
  "audit:view",
  "store:view",
  "store:create",
  "store:update",
  "store:delete",
] as const;

// Permissions granted to a store manager.
export const STORE_MANAGER_PERMISSIONS = [
  "food:view",
  "food:create",
  "food:update",
  "food:delete",
  "store:view",
  "store:update",
  "order:view",
  "order:update",
] as const;

// Mapping from role name to its permission list.
// These are seed defaults only. Runtime authorization always uses database
// role-permission assignments from the signed-in session.
export const SEED_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [...SUPER_ADMIN_PERMISSIONS],
};

// All unique permissions across all roles.
export const ALL_PERMISSIONS: Permission[] = Array.from(
  new Set([
    ...USER_PERMISSIONS,
    ...ADMIN_PERMISSIONS,
    ...STORE_MANAGER_PERMISSIONS,
    ...SUPER_ADMIN_PERMISSIONS,
  ])
);

// Check if the provided permissions include a specific permission.
// A wildcard "*" in the permissions list grants all permissions.
export const can = (permissions: Permission[], permission: Permission): boolean => {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
};

// Check if permissions include at least one of the requiredPermissions.
export const canAny = (permissions: Permission[], requiredPermissions: Permission[]): boolean => {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return requiredPermissions.some((perm) => permissions.includes(perm));
};

// Check if permissions include all of the requiredPermissions.
export const canAll = (permissions: Permission[], requiredPermissions: Permission[]): boolean => {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return requiredPermissions.every((perm) => permissions.includes(perm));
};

// Utility to create a bound permission-checker for a specific permissions list.
export const createCan = (permissions: Permission[]) => {
  return {
    can: (permission: Permission) => can(permissions, permission),
    canAny: (requiredPermissions: Permission[]) => canAny(permissions, requiredPermissions),
    canAll: (requiredPermissions: Permission[]) => canAll(permissions, requiredPermissions),
  };
};
