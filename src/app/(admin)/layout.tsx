"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Sidebar from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen">

      {/* ✅ Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1">

        {/* ✅ Mobile Header */}
        <header className="flex items-center justify-between p-4 border-b md:hidden">
          <h1 className="font-semibold">Admin</h1>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>

        {/* ✅ Page Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  )
}