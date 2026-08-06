# Next.js Skill

## Overview
Next.js 16.2.9 with React 19.2.4, using the App Router, Server Components, Server Actions, and Route Handlers.

## Core Concepts
- **App Router**: File-system based routing under `src/app/`. Use route groups `(public)`, `(admin)`, `(auth)`, `(user)` to organize pages without affecting URLs.
- **Server Components**: Default for all components. Keep them server-side unless interactivity requires `"use client"`.
- **Server Actions**: Async functions with `"use server"` directive. Used for mutations in `src/features/*/actions.ts` and `src/app/actions/`.
- **Route Handlers**: REST endpoints in `src/app/api/`. Export `GET`, `POST`, `PATCH`, `DELETE` functions from `route.ts`.
- **Middleware**: Route protection lives in `src/proxy.ts` (must be at project root as `middleware.ts` to function). Uses `next-auth/jwt` for token inspection.

## Project-Specific Patterns
- **Route Groups**: `(admin)/admin/dashboard` maps to `/admin/dashboard`. `(public)/products/dishes` maps to `/products/dishes`.
- **Server Actions in Features**: Business logic for cart, products, orders, and address lives in `src/features/[feature]/actions.ts`. Cross-cutting actions (auth, audit, RBAC) live in `src/app/actions/`.
- **API Routes**: REST endpoints under `src/app/api/` for client-side `fetch()` calls. Examples: `/api/cart`, `/api/orders`, `/api/payment/initiate`.
- **Dynamic Params**: Use `params: Promise<{ id: string }>` for dynamic route segments (Next.js 15+ pattern). Await params in Server Components.

## Best Practices
- Use `async/await` for all data fetching in Server Components
- Keep client components as leaf nodes; pass data down from parents
- Use `next/navigation` (`useRouter`, `useSearchParams`, `redirect`) for navigation
- Use `Image` from `next/image` with `src` set to absolute URLs or `loader` configuration for external hosts (imgbb)
- Use `cookies()` and `headers()` from `next/headers` in Server Actions for cookie manipulation
- Use `crypto.randomUUID()` for generating guest IDs and idempotency keys

## Common Mistakes to Avoid
- **Missing middleware file**: `src/proxy.ts` is not automatically middleware. Next.js requires `middleware.ts` at the project root. If `proxy.ts` exists, ensure it is properly wired or rename to `middleware.ts`.
- **Duplicate auth routes**: Both `src/app/(auth)/sign-in/page.tsx` and `src/app/(auth)/signin/page.tsx` exist. Consolidate to one canonical route.
- **Empty placeholder files**: `src/features/orders/queries.ts`, `src/features/products/queries.ts`, and `src/features/products/types.ts` contain only comments. Remove or implement before importing.
- **Mixed data fetching**: Avoid mixing Server Component direct fetches, client-side `fetch()`, and Server Actions for the same data. Choose one pattern per feature.
- **Hardcoded values**: Delivery fee (`50`), phone (`01700000000`), and country (`BD`) are hardcoded in payment logic. Move to config or derive from data.
- **Incorrect dynamic params**: Some API routes use `params: Promise<{ id: string }>` while others may not. Standardize on the Promise pattern for Next.js 16.
