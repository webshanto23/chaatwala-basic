// A Permission is represented as a simple string, e.g. "food:view".
export type Permission = string;

// RoleName lists the available built-in roles in the system.
export type RoleName = "admin" | "user" | "store_manager";

// Permissions granted to a regular user.
export const USER_PERMISSIONS = [
  "user:access",
  "order:create",
  "payment:create",
  "food:view",
  "food:like",
  "food:share",
  "feedback:create",
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
  "admin:create",
  "admin:delete",
  "role:manage",
  "audit:view",
  "admin:access",
  "store:view",
  "store:create",
  "store:update",
  "store:delete",
] as const;

// Permissions granted to a store manager.
export const STORE_MANAGER_PERMISSIONS = [
  "user:access",
  "food:view",
  "food:create",
  "food:update",
  "food:delete",
  "user:view",
] as const;

// Mapping from role name to its permission list.
export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  user: [...USER_PERMISSIONS],
  admin: [...ADMIN_PERMISSIONS],
  store_manager: [...STORE_MANAGER_PERMISSIONS],
};

// All unique permissions across all roles.
export const ALL_PERMISSIONS: Permission[] = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat())
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
