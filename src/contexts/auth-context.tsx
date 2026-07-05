"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { clearAuthCookie, getAuthCookie, setAuthCookie, type AuthRole } from "@/lib/auth";

type AuthState = {
  isAuthenticated: boolean;
  role: AuthRole | null;
  name: string | null;
};

type AuthContextValue = {
  auth: AuthState;
  loginUser: (email?: string, password?: string) => void;
  loginAdmin: (email?: string, password?: string) => void;
  logout: () => void;
};

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  role: null,
  name: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    Promise.resolve().then(() => {
      const stored = getAuthCookie();
      if (stored) {
        setAuth(stored);
      }
    });
  }, []);

  const loginUser = (email = "customer@example.com", password = "password") => {
    if (!email.trim() || !password.trim()) return;
    const nextState = {
      isAuthenticated: true,
      role: "user" as const,
      name: email.split("@")[0] || "Customer",
    };
    setAuth(nextState);
    setAuthCookie(nextState);
  };

  const loginAdmin = (email = "admin@example.com", password = "password") => {
    if (!email.trim() || !password.trim()) return;
    const nextState = {
      isAuthenticated: true,
      role: "admin" as const,
      name: email.split("@")[0] || "Admin",
    };
    setAuth(nextState);
    setAuthCookie(nextState);
  };

  const logout = () => {
    setAuth(defaultAuthState);
    clearAuthCookie();
  };

  const value = useMemo(
    () => ({ auth, loginUser, loginAdmin, logout }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
