"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const links = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Users", href: "/admin/users" },
  { name: "Roles", href: "/admin/roles" },
  { name: "Store", href: "/admin/stores" },
  { name: "Audit Logs", href: "/admin/audit" },
  { name: "Dishes", href: "/admin/products/dishes" },
  { name: "Drinks", href: "/admin/products/drinks" },
  { name: "Combos", href: "/admin/products/combos" },
  { name: "Orders", href: "/admin/orders" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/admin/dashboard");
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card p-4">
      <h2 className="mb-6 text-xl font-bold text-primary">Admin Panel</h2>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-primary font-medium text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {link.name}
          </Link>
        ))}

        <h2 className="mb-6 text-xl font-bold text-primary">Public View</h2>
        <Link
          href="/"
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/"
              ? "bg-primary font-medium text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          Home
        </Link>
        <Link
          href="/products/dishes"
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/"
              ? "bg-primary font-medium text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          Products
        </Link>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}
