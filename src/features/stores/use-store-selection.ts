"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Store = { id: string; name: string; address: string };
type CartItem = { id: string; productId: string; productType: string; name: string };

export function useStoreSelection({
  userId,
  isSessionLoading,
  items,
}: {
  userId: string | null;
  isSessionLoading: boolean;
  items: CartItem[];
}) {
  const storageKey = useMemo(
    () => `chaatwala:selected-store:${userId ?? "guest"}`,
    [userId],
  );
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState({ scope: storageKey, id: null as string | null });
  const [storesError, setStoresError] = useState<string | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storeInvalid, setStoreInvalid] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<CartItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidatingStore, setIsValidatingStore] = useState(false);

  const loadStores = useCallback(async () => {
    setSelectedStore({ scope: storageKey, id: null });
    setIsLoadingStores(true);
    setStoresError(null);
    try {
      const res = await fetch("/api/stores");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const nextStores = Array.isArray(data.stores) ? data.stores : [];
      setStores(nextStores);
      const saved = localStorage.getItem(storageKey);
      setSelectedStore({
        scope: storageKey,
        id: saved && nextStores.some((store: Store) => store.id === saved) ? saved : null,
      });
      if (saved && !nextStores.some((store: Store) => store.id === saved)) {
        localStorage.removeItem(storageKey);
      }
    } catch {
      setStores([]);
      setSelectedStore({ scope: storageKey, id: null });
      setStoresError("Could not load stores. Please try again.");
    } finally {
      setIsLoadingStores(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isSessionLoading) return;
    Promise.resolve().then(() => void loadStores());
  }, [isSessionLoading, loadStores]);

  const activeSelectedStoreId = selectedStore.scope === storageKey ? selectedStore.id : null;

  useEffect(() => {
    if (!activeSelectedStoreId || items.length === 0) {
      Promise.resolve().then(() => {
        setStoreInvalid(false);
        setUnavailableItems([]);
        setValidationError(null);
        setIsValidatingStore(false);
      });
      return;
    }

    let cancelled = false;
    const validate = async () => {
      setIsValidatingStore(true);
      setValidationError(null);
      try {
        const res = await fetch("/api/cart/validate-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: activeSelectedStoreId }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        const unavailable = data.unavailableItems ?? [];
        setStoreInvalid(!data.valid);
        setUnavailableItems(unavailable);
      } catch {
        if (!cancelled) {
          setStoreInvalid(false);
          setUnavailableItems([]);
          setValidationError("Could not validate store availability. Please try again.");
        }
      } finally {
        if (!cancelled) setIsValidatingStore(false);
      }
    };
    void validate();
    return () => {
      cancelled = true;
    };
  }, [activeSelectedStoreId, items]);

  const selectStore = useCallback((storeId: string | null) => {
    setSelectedStore({ scope: storageKey, id: storeId });
    if (storeId) localStorage.setItem(storageKey, storeId);
    else localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    stores,
    selectedStoreId: activeSelectedStoreId,
    selectStore,
    storesError,
    isLoadingStores,
    retryStores: loadStores,
    storeInvalid,
    unavailableItems,
    validationError,
    isValidatingStore,
  };
}
