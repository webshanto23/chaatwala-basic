"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getVisibleStaffNavigation } from "@/features/staff-navigation/registry";
import { cn } from "@/lib/utils";

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, logout } = useAuth();
  const items = getVisibleStaffNavigation(auth.permissions, auth.workspace === "staff" && auth.systemRoleKey === "super_admin");

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card p-4">
      <h2 className="mb-6 text-xl font-bold text-primary">Staff Workspace</h2>
      <nav className="flex-1 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors", pathname === item.href ? "bg-primary font-medium text-primary-foreground" : "text-foreground hover:bg-muted")}><Icon className="h-4 w-4" />{item.label}</Link>;
        })}
      </nav>
      <button type="button" onClick={async () => { await logout(); router.push("/staff/sign-in"); }} className="mt-4 flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"><LogOut className="h-4 w-4" />Logout</button>
    </aside>
  );
}
