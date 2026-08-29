import type { RoleName, Workspace } from "@/lib/permissions";

export function getSafeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function getRoleHome(role: RoleName | null | undefined): string {
  if (role === "super_admin") return "/staff";
  return "/profile/dashboard";
}

export function getWorkspaceHome(workspace: Workspace | null | undefined): string {
  return workspace === "staff" ? "/staff" : "/profile/dashboard";
}
