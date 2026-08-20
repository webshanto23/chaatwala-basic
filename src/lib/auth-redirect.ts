import type { RoleName } from "@/lib/permissions";

export function getSafeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function getRoleHome(role: RoleName | null | undefined): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "store_manager") return "/store-manager/dashboard";
  return "/profile/dashboard";
}
