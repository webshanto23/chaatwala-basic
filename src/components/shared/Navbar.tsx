
"use client";

import data from "../../../sitedata.json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Logo } from "@/components/shared/footer/logo";
import { useAuth } from "@/contexts/auth-context";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const isLoggedIn = auth.isAuthenticated;
  const isAdmin = auth.role === "admin" || auth.role === "super_admin";
  const isUser = auth.role === "user";

  const publicLinks = data.navigation.publicLinks;

  const userLinks = data.navigation.userLinks;

  return (
    <header className="w-full border-b bg-card dark:bg-card transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-heading font-bold text-lg text-primary hover:opacity-80 transition-opacity">
            <Logo className="h-9 md:h-8 w-auto" />

          </Link>
        </div>

        {/* Desktop Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-6">

            {(!isLoggedIn || isUser) && publicLinks.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link href={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            {isUser && (
              <>
                {userLinks.filter((item) => item.href !== "/").map((item) => (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link href={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </>
            )}

            {isAdmin && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin Dashboard</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Auth */}
        <div className="hidden md:flex gap-4">
          {!isLoggedIn ? (
            <>
              <Link href="/signin" className="text-sm hover:text-primary transition-colors">Sign In</Link>
              <Link href="/sign-up" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">Sign Up</Link>
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
              <button className="rounded-lg p-2 transition-colors hover:bg-muted" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[85vw] max-w-sm border-l bg-card p-0">
              <div className="flex h-full flex-col px-5 py-6">
                <div className="mb-6 flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Logo className="h-8 w-auto" />
                    <span>Chaatwala</span>
                  </Link>
                </div>

                <nav className="flex flex-col gap-1">
                  {(!isLoggedIn || isUser) && publicLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}

                  {isUser && userLinks.filter((item) => item.href !== "/").map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </nav>

                <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
                  {!isLoggedIn ? (
                    <>
                      <Link href="/signin" className="rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary">
                        Sign In
                      </Link>
                      <Link href="/sign-up" className="rounded-md px-2 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted">
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
                      className="flex items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
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



