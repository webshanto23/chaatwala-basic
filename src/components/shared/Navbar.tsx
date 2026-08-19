"use client";

import { useEffect } from "react";
import data from "../../../sitedata.json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ShoppingCart, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/shared/footer/logo";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-can";
import { useCart } from "@/features/cart/context";
import { useTheme } from "@/contexts/theme-context";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const { role } = usePermissions();
  const { totalItems, clear } = useCart();
  const isLoggedIn = auth.isAuthenticated;
  const isAdmin = role === "admin";
  const isStoreManager = role === "store_manager";

  useEffect(() => {
    if (isAdmin) {
      clear().catch(() => {});
    }
  }, [isAdmin, clear]);

  const publicLinks = data.navigation.publicLinks;
  const userLinks = data.navigation.userLinks;
  const adminLinks = data.navigation.adminLinks;
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="w-full sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-heading inline-flex items-center gap-3 text-lg font-semibold text-foreground hover:text-primary transition-colors duration-200"
          >
            <Logo className="h-10 w-auto" />
            <span className="hidden">Chaatwalaa!</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <NavigationMenu key={isAdmin ? "admin" : "public"} className="hidden md:flex rounded-full  px-4 py-1">
          <NavigationMenuList className="gap-2">
            {!isLoggedIn && publicLinks.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            {isLoggedIn && !isAdmin && !isStoreManager && (
              <>
                {userLinks.map((item) => (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className="rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </>
            )}

            {isStoreManager && (
              <>
                {publicLinks.map((item) => (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className="hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/store-manager/dashboard"
                      className="hover:text-primary transition-colors"
                    >
                      Store Manager Dashboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}

            {isAdmin &&
              adminLinks.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className="hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            {isAdmin && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/admin/dashboard"
                    className="hover:text-primary transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Auth + Cart */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-2 text-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="Toggle theme"
          >
            {mounted
              ? theme === "dark"
                ? <Sun className="h-5 w-5" />
                : <Moon className="h-5 w-5" />
              : <Moon className="h-5 w-5" />}
          </button>

          {!isAdmin && !isStoreManager && (
            <Link
              href="/cart"
              className="relative rounded-full p-2 text-foreground transition-colors hover:bg-muted hover:text-primary"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {!isLoggedIn ? (
            <>
              <Link
                href="/sign-in"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Sign In
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[85vw] max-w-sm border-l bg-card p-0"
            >
              <div className="flex h-full flex-col px-5 py-6">
                <div className="mb-6 flex items-center justify-between">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <Logo className="h-8 w-auto" />
                    <span>Chaatwala</span>
                  </Link>
                </div>

                <nav className="flex flex-col gap-1">
                  {!isLoggedIn && publicLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}

                  {isLoggedIn && !isAdmin && !isStoreManager && userLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}

                  {isStoreManager && (
                    <>
                      {publicLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <Link
                        href="/store-manager/dashboard"
                        className="rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                      >
                        Store Manager Dashboard
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {isAdmin && adminLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                  >
                    {mounted
                      ? theme === "dark"
                        ? <Sun className="h-4 w-4" />
                        : <Moon className="h-4 w-4" />
                      : <Moon className="h-4 w-4" />}
                    {mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Dark Mode"}
                  </button>
                  {!isAdmin && !isStoreManager && (
                    <Link
                      href="/cart"
                      className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Cart
                      {totalItems > 0 && (
                        <span className="ml-auto bg-secondary text-secondary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  )}

                  {!isLoggedIn ? (
                    <>
                      <Link
                        href="/sign-in"
                        className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="rounded-md px-2 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted"
                      >
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        router.push("/");
                      }}
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
