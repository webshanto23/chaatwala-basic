export type Permission = string;

export type RoleName = "admin" | "user" | "store_manager";

export const USER_PERMISSIONS = [
  "user:access",
  "order:create",
  "payment:create",
  "food:view",
  "food:like",
  "food:share",
  "feedback:create",
] as const;

export const ADMIN_PERMISSIONS = [
  "user:access",
  "user:view",
  "user:updateRole",
  "user:delete",
  "food:create",
  "food:update",
  "food:delete",
  "admin:create",
  "admin:delete",
  "role:manage",
  "audit:view",
  "admin:access",
] as const;

export const STORE_MANAGER_PERMISSIONS = [
  "user:access",
  "food:view",
  "food:create",
  "food:update",
  "food:delete",
  "user:view",
] as const;

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  user: [...USER_PERMISSIONS],
  admin: [...ADMIN_PERMISSIONS],
  store_manager: [...STORE_MANAGER_PERMISSIONS],
};

export const ALL_PERMISSIONS: Permission[] = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat())
);

export const can = (permissions: Permission[], permission: Permission): boolean => {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
};

export const canAny = (permissions: Permission[], requiredPermissions: Permission[]): boolean => {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return requiredPermissions.some((perm) => permissions.includes(perm));
};

export const canAll = (permissions: Permission[], requiredPermissions: Permission[]): boolean => {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return requiredPermissions.every((perm) => permissions.includes(perm));
};

export const createCan = (permissions: Permission[]) => {
  return {
    can: (permission: Permission) => can(permissions, permission),
    canAny: (requiredPermissions: Permission[]) => canAny(permissions, requiredPermissions),
    canAll: (requiredPermissions: Permission[]) => canAll(permissions, requiredPermissions),
  };
};
