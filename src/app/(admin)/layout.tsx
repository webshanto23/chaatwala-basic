"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Sidebar from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">

      {/* ✅ Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1">

        {/* ✅ Mobile Header */}
        <header className="flex items-center justify-between p-4 border-b md:hidden bg-card">
          <h1 className="font-bold text-foreground">Admin</h1>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="hover:bg-muted">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-0 bg-card">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>

        {/* ✅ Page Content */}
        <main className="p-4 md:p-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}