import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { can, canAny, type Permission } from "@/lib/permissions";

type PermissionRule = {
  require: Permission | Permission[];
  unauthorizedRedirect?: string;
};

const routeRules: Record<string, PermissionRule> = {
  "/dashboard": { require: "user:access", unauthorizedRedirect: "/signin" },
  "/cart": { require: "user:access", unauthorizedRedirect: "/signin" },
  "/profile": { require: "user:access", unauthorizedRedirect: "/signin" },
  "/admin/dashboard": { require: "admin:access", unauthorizedRedirect: "/" },
  "/admin/users": { require: "users:view", unauthorizedRedirect: "/" },
  "/admin/dishes": { require: "products:view", unauthorizedRedirect: "/" },
  "/admin/drinks": { require: "products:view", unauthorizedRedirect: "/" },
  "/admin/combos": { require: "products:view", unauthorizedRedirect: "/" },
};

const publicPaths = new Set([
  "/",
  "/about",
  "/products",
  "/signin",
  "/sign-in",
  "/sign-up",
  "/admin",
]);

function getPermissionRule(pathname: string): PermissionRule | null {
  if (routeRules[pathname]) return routeRules[pathname];
  if (pathname.startsWith("/admin")) return { require: "admin:access", unauthorizedRedirect: "/" };
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/cart") || pathname.startsWith("/profile")) {
    return { require: "user:access", unauthorizedRedirect: "/signin" };
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token);
  const permissions = (token?.permissions as Permission[]) ?? [];

  if (pathname === "/signin" || pathname === "/sign-in") {
    if (isAuthenticated) {
      if (can(permissions, "admin:access")) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/profile/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    if (can(permissions, "admin:access")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const rule = getPermissionRule(pathname);

  if (rule) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(rule.unauthorizedRedirect ?? "/signin", request.url));
    }

    const required = Array.isArray(rule.require) ? rule.require : [rule.require];
    const authorized = canAny(permissions, required) || can(permissions, "*");

    if (!authorized) {
      return NextResponse.redirect(new URL(rule.unauthorizedRedirect ?? "/", request.url));
    }

    if (pathname.startsWith("/admin") && can(permissions, "user:access")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/cart") || pathname.startsWith("/profile")) && can(permissions, "admin:access")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (!publicPaths.has(pathname) && !pathname.startsWith("/products/")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
