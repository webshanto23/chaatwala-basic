
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
    <header className="w-full border-b bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={36}
            height={36}
            className="border-r pr-3 border-zinc-300 dark:border-zinc-700"
          />
          <Link href="/" className="font-semibold text-lg">
            Chaatwala
          </Link>
        </div>

        {/* Desktop Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-6">

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/about">About</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Products Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-3 p-4">
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
                <Link href="/order">Order</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Auth */}
        <div className="hidden md:flex gap-4">
          <Link href="/sign-in">Sign In</Link>
          <Link href="/sign-up">Sign Up</Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button>
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-6">

                <Link href="/">Home</Link>
                <Link href="/about">About</Link>

                <div>
                  <p className="font-medium">Products</p>
                  <div className="ml-2 mt-2 flex flex-col gap-2">
                    {components.map((item) => (
                      <Link key={item.title} href={item.href}>
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link href="/order">Order</Link>

                <hr />

                <Link href="/sign-in">Sign In</Link>
                <Link href="/sign-up">Sign Up</Link>

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
        <Link href={href}>
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


//basic nav layout with links to home, about, and contact pages
// import Image from "next/image";
// import Link from "next/link";

// export default function Navbar() {
//   return (
//     <div>
//       <div className="flex items-center justify-between font-sans bg-zinc-100 dark:bg-zinc-900">
//       <nav className="flex gap-4 p-4 text-center items-center">
//         <Image src="/favicon.ico" alt="Logo" width={50} height={50} />
//         <Link href="/">Chaatwala</Link>
//       </nav>
      
//       <nav className="flex gap-4 p-4 text-center">
//         <Link href="/">Home</Link>
//         <Link href="/about">About</Link>
//         <Link href="/products">Products</Link>
//         <Link href="/order">Order</Link>
        
//       </nav>
//       <nav className="flex gap-4 p-4 text-center">
//         <Link href="/sign-in">Sign In</Link>
//         <Link href="/sign-up">Sign Up</Link>
//       </nav>
//       </div>
//     </div>
    
//   );
// }
