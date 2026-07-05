"use client";

import { usePathname } from "next/navigation";

import { AuthProvider } from "@/contexts/auth-context";
import Navbar from "@/components/shared/Navbar";
import { SearchBar } from "@/components/shared/SearchBar";
import { Footer } from "@/components/shared/footer/Footer";
import { FloatingCart } from "@/components/shared/FloatingCart";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isHomeRoute = pathname === "/";

  return (
    <AuthProvider>
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && isHomeRoute && <SearchBar />}
      {children}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingCart />}
    </AuthProvider>
  );
}
