import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { can, canAny, type Permission } from "@/lib/permissions";

type PermissionRule = {
  require: Permission | Permission[];
  unauthorizedRedirect?: string;
};

const publicPaths = new Set([
  "/",
  "/about",
  "/products",
  "/sign-in",
  "/sign-up",
  "/terms-and-conditions",
  "/license",
  "/privacy-policy",
]);

function getPermissionRule(pathname: string): PermissionRule | null {
  if (pathname.startsWith("/admin")) {
    return { require: "admin:access", unauthorizedRedirect: "/" };
  }
  if (pathname.startsWith("/store-manager")) {
    return { require: "store:view", unauthorizedRedirect: "/" };
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout")
  ) {
    return { require: "user:access", unauthorizedRedirect: "/sign-in" };
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token);
  const permissions = (token?.permissions as Permission[]) ?? [];
  const isAdmin = can(permissions, "admin:access");

  if (pathname === "/signin") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (pathname === "/sign-in") {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(isAdmin ? "/admin/dashboard" : "/profile/dashboard", request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin/dashboard" : "/", request.url)
    );
  }

  if (pathname === "/store-manager") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    const isStoreManager = can(permissions, "store:view");
    return NextResponse.redirect(
      new URL(isStoreManager ? "/store-manager/dashboard" : "/", request.url)
    );
  }

  const rule = getPermissionRule(pathname);

  if (rule) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(rule.unauthorizedRedirect ?? "/sign-in", request.url));
    }

    const required = Array.isArray(rule.require) ? rule.require : [rule.require];
    const authorized = canAny(permissions, required) || can(permissions, "*");

    if (!authorized) {
      return NextResponse.redirect(new URL(rule.unauthorizedRedirect ?? "/", request.url));
    }

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const isStoreManager = can(permissions, "store:view");
    if (pathname.startsWith("/store-manager") && !isStoreManager) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isAdmin && pathname.startsWith("/store-manager")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (isStoreManager && (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/checkout") || pathname.startsWith("/profile") || pathname.startsWith("/orders") || pathname.startsWith("/cart"))) {
      return NextResponse.redirect(new URL("/store-manager/dashboard", request.url));
    }

    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout") || pathname.startsWith("/profile") || pathname.startsWith("/orders") || pathname.startsWith("/cart")) &&
      isAdmin
    ) {
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
