"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Dishes", href: "/admin/dishes" },
  { name: "Drinks", href: "/admin/drinks" },
  { name: "Combos", href: "/admin/combos" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-background p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "block px-3 py-2 rounded-md text-sm hover:bg-muted",
              pathname === link.href && "bg-muted font-medium"
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}