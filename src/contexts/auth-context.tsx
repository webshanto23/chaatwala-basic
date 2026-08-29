"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import type { RoleName, Workspace } from "@/lib/permissions";

type AuthRole = RoleName | null;

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  role: AuthRole | null;
  workspace: Workspace | null;
  systemRoleKey: string | null;
  name: string | null;
  permissions: string[];
};

type AuthContextValue = {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
};

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  return (
    <SessionProvider session={initialSession ?? undefined}>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

function InnerAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const auth = useMemo(() => ({
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    userId: session?.user?.id ?? null,
    role: (session?.user?.role as AuthRole) ?? null,
    workspace: (session?.user?.workspace as Workspace) ?? null,
    systemRoleKey: session?.user?.systemRoleKey ?? null,
    name: session?.user?.name ?? null,
    permissions: (session?.user?.permissions as string[]) ?? [],
  }), [status, session]);

  const login = useCallback(async (email: string, password: string) => {
    await signIn("customer-credentials", {
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
  const { auth } = useAuth();
  const identity = auth.isLoading
    ? "loading"
    : `${auth.userId ?? "anonymous"}:${auth.workspace ?? "none"}`;

  return (
    <UserDataState
      key={identity}
      userId={auth.userId}
      workspace={auth.workspace}
      isSessionLoading={auth.isLoading}
    >
      {children}
    </UserDataState>
  );
}

function UserDataState({
  children,
  userId,
  workspace,
  isSessionLoading,
}: {
  children: React.ReactNode;
  userId: string | null;
  workspace: Workspace | null;
  isSessionLoading: boolean;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(
    () => isSessionLoading || (workspace === "customer" && Boolean(userId)),
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || workspace !== "customer") {
      setProfile(null);
      setAddresses([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const res = await fetch("/api/user/me");
      if (!res.ok) {
        if (res.status === 401) {
          setProfile(null);
          setAddresses([]);
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to fetch user data: ${res.status}`);
      }
      const data = await res.json();
      setProfile({
        id: data.profile.id,
        name: data.profile.name ?? "",
        email: data.profile.email ?? "",
        image: data.profile.image ?? "",
        phone: data.profile.phone ?? "",
      });
      setAddresses(data.addresses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [userId, workspace]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await Promise.resolve();
      if (!cancelled && !isSessionLoading) {
        await refresh();
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isSessionLoading, refresh]);

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
