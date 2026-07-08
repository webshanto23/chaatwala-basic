import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token);
  const role = token?.role as "super_admin" | "admin" | "store_manager" | "user" | undefined;

  if (pathname === "/signin" || pathname === "/sign-in") {
    if (isAuthenticated) {
      if (role === "user") {
        return NextResponse.redirect(new URL("/profile/dashboard", request.url));
      }
      if (role === "admin" || role === "super_admin" || role === "store_manager") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    if (isAuthenticated) {
      if (role === "admin" || role === "super_admin" || role === "store_manager") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (role === "user") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const isUserRoute = pathname === "/dashboard" || pathname.startsWith("/cart") || pathname.startsWith("/profile");
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin";

  if (isUserRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    if (role !== "user") {
      if (role === "admin" || role === "super_admin" || role === "store_manager") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role !== "admin" && role !== "super_admin" && role !== "store_manager") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
