"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { CartProvider } from "@/features/cart/context";

const FloatingCart = dynamic(
  () => import("@/components/shared/FloatingCart").then((m) => m.FloatingCart),
  {
    ssr: false,
  },
);

const SearchBar = dynamic(
  () => import("@/components/shared/SearchBar").then((m) => m.SearchBar),
  {
    ssr: false,
  },
);

import Navbar from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/footer/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isHomeRoute = usePathname() === "/";

  return <CartProvider>
      <>
        <Navbar />
        {isHomeRoute && <SearchBar />}
        <main className="relative flex-1">
          {children}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed right-5 bottom-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-200 hover:-translate-y-1 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
            aria-label="Go to top"
          >
            <span className="text-2xl leading-none">↑</span>
          </button>
        </main>
        <Footer />
        <FloatingCart />
      </>
    </CartProvider>;
}
