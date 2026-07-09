export type Permission = string;

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
