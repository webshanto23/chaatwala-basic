import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, FileText, LayoutDashboard, Settings, ShieldCheck, Store, Users } from "lucide-react";

export type StaffNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: string[];
  superAdminOnly?: boolean;
};

export const staffNavigation: StaffNavigationItem[] = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/catalog/foods", label: "Food Catalog", icon: ClipboardList, permissions: ["food:view"] },
  { href: "/staff/operations/orders", label: "Orders", icon: FileText, permissions: ["order:view"] },
  { href: "/staff/operations/inventory", label: "Inventory", icon: ClipboardList, permissions: ["food:view"] },
  { href: "/staff/stores", label: "Stores", icon: Store, permissions: ["store:view"] },
  { href: "/staff/content/homepage", label: "Homepage", icon: LayoutDashboard, superAdminOnly: true },
  { href: "/staff/content/about", label: "About", icon: FileText, superAdminOnly: true },
  { href: "/staff/audit", label: "Audit Logs", icon: ClipboardList, permissions: ["audit:view"] },
  { href: "/staff/settings", label: "Settings", icon: Settings },
  { href: "/staff/access/staff", label: "Staff", icon: Users, superAdminOnly: true },
  { href: "/staff/access/roles", label: "Roles", icon: ShieldCheck, superAdminOnly: true },
  { href: "/staff/access/permissions", label: "Permissions", icon: Building2, superAdminOnly: true },
];

export function getVisibleStaffNavigation(permissions: string[], isSuperAdmin: boolean) {
  return staffNavigation.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    return !item.permissions || item.permissions.some((permission) => permissions.includes(permission) || permissions.includes("*"));
  });
}
