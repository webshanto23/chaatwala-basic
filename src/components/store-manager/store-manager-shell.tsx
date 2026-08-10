"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import StoreManagerSidebar from "@/components/store-manager/sidebar";

export default function StoreManagerShell({ children, storeId }: { children: React.ReactNode; storeId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 border-r bg-card">
        <StoreManagerSidebar storeId={storeId} />
      </aside>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b md:hidden bg-card">
          <h1 className="font-bold text-foreground">Store Manager</h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="hover:bg-muted">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-card">
              <StoreManagerSidebar storeId={storeId} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="p-4 md:p-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
