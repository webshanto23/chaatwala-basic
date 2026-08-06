"use client";

import { useCallback, useRef } from "react";

type RequestDedupe = {
  current: Record<string, Promise<unknown>>;
};

export function useRequestDedupe() {
  const pendingRef = useRef<RequestDedupe["current"]>({});

  const dedupe = useCallback(
    async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
      const existing = pendingRef.current[key];
      if (existing) {
        return existing as Promise<T>;
      }

      const promise = fn();
      pendingRef.current[key] = promise;

      try {
        const result = await promise;
        return result as T;
      } finally {
        delete pendingRef.current[key];
      }
    },
    []
  );

  return { dedupe };
}
