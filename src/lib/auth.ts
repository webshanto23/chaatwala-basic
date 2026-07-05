"use client";

export type AuthRole = "super_admin" | "admin" | "user";

export type AuthSession = {
  isAuthenticated: boolean;
  role: AuthRole | null;
  name: string | null;
};

const AUTH_COOKIE_NAME = "chaatwala-auth";

export function setAuthCookie(session: AuthSession) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=60*60*24*7; SameSite=Lax`;
}

export function getAuthCookie(): AuthSession | null {
  if (typeof document === "undefined") return null;

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!cookieValue) return null;

  try {
    return JSON.parse(decodeURIComponent(cookieValue.split("=")[1]));
  } catch {
    return null;
  }
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function isRouteAllowed(role: AuthRole | null, pathname: string) {
  if (pathname === "/" || pathname === "/about" || pathname === "/products") {
    return true;
  }

  if (pathname === "/admin") {
    return role === "admin" || role === "super_admin" || !role;
  }

  if (pathname.startsWith("/admin")) {
    return role === "admin" || role === "super_admin";
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/cart") || pathname.startsWith("/profile")) {
    return role === "user";
  }

  return true;
}
