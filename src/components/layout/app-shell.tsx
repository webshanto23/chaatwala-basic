"use client";

import { usePathname } from "next/navigation";

import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/features/cart/context";
import Navbar from "@/components/shared/Navbar";
import { SearchBar } from "@/components/shared/SearchBar";
import { Footer } from "@/components/shared/footer/Footer";
import { FloatingCart } from "@/components/shared/FloatingCart";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isHomeRoute = pathname === "/";

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {!isAdminRoute && <Navbar />}
          {!isAdminRoute && isHomeRoute && <SearchBar />}
          <main className="relative flex-1">
            {children}
            {!isAdminRoute && (
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="fixed right-5 bottom-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-200 hover:-translate-y-1 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
                aria-label="Go to top"
              >
                <span className="text-2xl leading-none">↑</span>
              </button>
            )}
          </main>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <FloatingCart />}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
