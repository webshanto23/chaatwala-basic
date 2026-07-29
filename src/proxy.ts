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
  "/cart",
  "/signin",
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
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders")
  ) {
    return { require: "user:access", unauthorizedRedirect: "/signin" };
  }
  if (pathname.startsWith("/checkout")) {
    return { require: "user:access", unauthorizedRedirect: "/signin" };
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

  if (pathname === "/signin" || pathname === "/sign-in") {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(isAdmin ? "/admin/dashboard" : "/profile/dashboard", request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin/dashboard" : "/", request.url)
    );
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

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout") || pathname.startsWith("/profile") || pathname.startsWith("/orders")) &&
      isAdmin
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (!publicPaths.has(pathname) && !pathname.startsWith("/products/") && !pathname.startsWith("/cart")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
