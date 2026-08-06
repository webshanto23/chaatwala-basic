import { getRoles, getPermissions } from "@/app/actions/rbac";
import { RolesClient } from "./RolesClient";

export const revalidate = 120;

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([getRoles(), getPermissions()]);
  const safeRoles = roles.roles ?? [];
  const safePerms = permissions.permissions ?? [];

  return <RolesClient initialRoles={safeRoles} initialPermissions={safePerms} />;
}
