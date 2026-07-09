"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { createCan, type Permission } from "@/lib/permissions";

export function useCan() {
  const { data: session } = useSession();
  const permissions = useMemo(() => (session?.user?.permissions as Permission[]) ?? [], [session?.user?.permissions]);

  return useMemo(() => createCan(permissions), [permissions]);
}

export function usePermissions() {
  const { data: session } = useSession();
  const permissions = useMemo(() => (session?.user?.permissions as Permission[]) ?? [], [session?.user?.permissions]);
  const role = useMemo(() => session?.user?.role ?? null, [session?.user?.role]);

  const checker = useMemo(() => createCan(permissions), [permissions]);

  return {
    permissions,
    role,
    can: checker.can,
    canAny: checker.canAny,
    canAll: checker.canAll,
  };
}
