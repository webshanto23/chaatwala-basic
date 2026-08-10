"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/store-manager/dashboard" },
  { name: "My Store", href: "/store-manager/store" },
  { name: "Orders Management", href: "/store-manager/orders" },
  { name: "Menu / Inventory Management", href: "/store-manager/inventory" },
];

export default function StoreManagerSidebar({ storeId: _storeId }: { storeId: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card p-4">
      <h2 className="mb-6 text-xl font-bold text-primary">Store Manager</h2>

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
      </nav>
    </aside>
  );
}
