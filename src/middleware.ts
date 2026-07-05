import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/about", "/products", "/signin", "/sign-in", "/sign-up", "/admin"];

function getSession(request: NextRequest) {
  const cookie = request.cookies.get("chaatwala-auth")?.value;
  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);
  const role = session?.role ?? null;
  const isAuthenticated = Boolean(session?.isAuthenticated);

  const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/products/");
  const isUserRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/cart") || pathname.startsWith("/profile");
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin";

  if (pathname === "/signin") {
    if (isAuthenticated && role === "user") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isAuthenticated && (role === "admin" || role === "super_admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (pathname === "/admin") {
    if (isAuthenticated && (role === "admin" || role === "super_admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (isAuthenticated && role === "user") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isUserRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    if (role !== "user") {
      if (role === "admin" || role === "super_admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (!isPublicPath && !isUserRoute && !isAdminRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
