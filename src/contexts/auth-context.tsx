"use client";

import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import type { RoleName } from "@/lib/permissions";

type AuthRole = RoleName | null;

type AuthState = {
  isAuthenticated: boolean;
  role: AuthRole | null;
  name: string | null;
  permissions: string[];
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
    permissions: (session?.user?.permissions as string[]) ?? [],
  }), [status, session]);

  const login = useCallback(async (email: string, password: string) => {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
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

type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string;
  phone: string;
};

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string | null;
  isDefault: boolean;
};

type UserDataContextValue = {
  profile: UserProfile | null;
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  setAddresses: (addresses: Address[]) => void;
};

const UserDataContext = createContext<UserDataContextValue | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [profileRes, addressRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/user/address"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile({
          id: profileData.user.id,
          name: profileData.user.name ?? "",
          email: profileData.user.email ?? "",
          image: profileData.user.image ?? "",
          phone: profileData.phone ?? "",
        });
      }

      if (addressRes.ok) {
        const addressData = await addressRes.json();
        setAddresses(addressData.addresses ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <UserDataContext.Provider value={{ profile, addresses, isLoading, error, refresh, setProfile, setAddresses }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider");
  }
  return context;
}
