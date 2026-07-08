"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

type AuthRole = "super_admin" | "admin" | "store_manager" | "user";

type AuthState = {
  isAuthenticated: boolean;
  role: AuthRole | null;
  name: string | null;
};

type AuthContextValue = {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

function InnerAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const auth = useMemo(() => ({
    isAuthenticated: status === "authenticated",
    role: (session?.user?.role as AuthRole) ?? null,
    name: session?.user?.name ?? null,
  }), [status, session]);

  const login = useCallback(async (email: string, password: string) => {
    await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email,
        password,
        redirect: "false",
        json: "true",
      }),
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const value = useMemo(() => ({ auth, login, logout }), [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
