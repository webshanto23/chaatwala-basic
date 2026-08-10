"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-can";

type SearchItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: string;
};

const CLIENT_CACHE_TTL = 60 * 1000;
const DEBOUNCE_MS = 350;

export function SearchBar() {
  const { auth } = useAuth();
  const { can } = usePermissions();
  const isAdmin = can("admin:access");
  const isStoreManager = can("store:view");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);

  if (isAdmin || isStoreManager) return null;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const clientCache = useRef(
    new Map<string, { data: SearchItem[]; timestamp: number }>(),
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/search/popular")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.tags)) {
          setPopularTags(data.tags);
        }
      })
      .catch(() => {
        if (!cancelled) setPopularTags([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPopular(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const searchProducts = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = clientCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
      setResults(cached.data);
      setIsLoading(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("q", trimmed);

      const res = await fetch(url.toString(), {
        signal: abortController.current.signal,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Search failed with status ${res.status}`);
      }

      const data = (await res.json()) as { results?: SearchItem[] };
      const searchResults = data.results ?? [];

      clientCache.current.set(cacheKey, {
        data: searchResults,
        timestamp: Date.now(),
      });

      setResults(searchResults);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchProducts(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [query, searchProducts]);

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const hasResults = useMemo(() => query.trim().length > 0, [query]);

  return (
    <div className="flex flex-col items-center justify-center bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
          <div className="rounded-[2rem] border border-border/80 bg-card/90 p-6 shadow-xl shadow-primary/10 backdrop-blur-xl sm:p-8">
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-secondary">
              Good afternoon!
            </p>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              What would you like to eat today?
            </h1>
          </div>

          <Field
            orientation="horizontal"
            className="w-full rounded-full border border-border/70 bg-background shadow-sm"
          >
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dishes, drinks, combos..."
              className="flex-1 rounded-l-full border-none bg-transparent px-5 py-4 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Button
              className="rounded-r-full px-6 py-4"
              type="button"
              disabled={isLoading}
            >
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </Field>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Popular searches:
            </span>
            {isLoadingPopular
              ? Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-7 w-20 rounded-full bg-muted animate-pulse"
                  />
                ))
              : popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="rounded-full border border-border/80 bg-muted/70 px-3 py-2 text-xs transition hover:bg-primary/10 hover:text-primary"
                  >
                    {tag}
                  </button>
                ))}
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}

          {hasResults && !error && (
            <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/95 p-4 shadow-sm">
              {results.length > 0 ? (
                <ul className="space-y-3">
                  {results.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-3xl border border-border/60 bg-muted/30 px-4 py-3 transition hover:border-primary/50 hover:bg-primary/10"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                          {item.category}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  {isLoading ? "Searching..." : "No matching items found."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
