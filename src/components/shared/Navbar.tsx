
"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const components = [
  {
    title: "Dishes",
    href: "/products/dishes",
    description: "Delicious street snacks and chaats.",
  },
  {
    title: "Drinks",
    href: "/products/drinks",
    description: "Refreshing beverages and juices.",
  },
  {
    title: "Combos",
    href: "/products/combos",
    description: "Best value combo meals.",
  },
];

export default function Navbar() {
  return (
    <header className="w-full border-b bg-card dark:bg-card transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={36}
            height={36}
            className="border-r pr-3 border-border"
          />
          <Link href="/" className="font-heading font-bold text-lg text-primary hover:opacity-80 transition-opacity">
            Chaatwala
          </Link>
        </div>

        {/* Desktop Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-6">

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/about" className="hover:text-primary transition-colors">About</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Products Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="hover:text-primary transition-colors">Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-3 p-4 bg-popover rounded-lg shadow-lg">
                  {components.map((item) => (
                    <ListItem key={item.title} href={item.href} title={item.title}>
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Auth */}
        <div className="hidden md:flex gap-4">
          <Link href="/sign-in" className="text-sm hover:text-primary transition-colors">Sign In</Link>
          <Link href="/sign-up" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">Sign Up</Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-64 bg-card">
              <div className="flex flex-col gap-4 mt-6">

                <Link href="/" className="hover:text-primary transition-colors py-2">Home</Link>
                <Link href="/about" className="hover:text-primary transition-colors py-2">About</Link>

                <div>
                  <p className="font-medium py-2">Products</p>
                  <div className="ml-2 mt-2 flex flex-col gap-2">
                    {components.map((item) => (
                      <Link key={item.title} href={item.href} className="text-sm hover:text-primary transition-colors py-1">
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link href="/dashboard" className="hover:text-primary transition-colors py-2">Dashboard</Link>
                <Link href="/cart" className="hover:text-primary transition-colors py-2">Cart</Link>

                <hr className="border-border" />

                <Link href="/sign-in" className="hover:text-primary transition-colors py-2">Sign In</Link>
                <Link href="/sign-up" className="font-medium text-primary hover:opacity-80 transition-opacity py-2">Sign Up</Link>

              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}

/* Dropdown Item */
function ListItem({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={href} className="block p-2 rounded-md hover:bg-muted transition-colors">
          <div className="flex flex-col gap-1 text-sm">
            <div className="font-medium">{title}</div>
            <div className="text-muted-foreground text-xs">
              {children}
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}



