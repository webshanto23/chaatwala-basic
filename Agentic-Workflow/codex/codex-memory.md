# Codex Session Memory — Chaatwala Basic

Last consolidated: 2026-08-20  
Use: persistent working context for future tasks. Re-inspect the relevant current source, schema, tests, and Next.js 16 documentation before editing; this memory speeds up orientation but does not override them.

## Authority and operating rules

1. **Current code and route architecture are authoritative.** `Agentic-Workflow/Memory/*` contains useful history and audit results, but may be stale. Verify every historical finding against source before acting.
2. Keep tasks bounded. Do not combine an auth refactor, authorization redesign, performance work, UI redesign, migration, and deployment change into one uncontrolled task.
3. Default process: understand → plan → inspect → implement → test → review → summarize. Discovery is read-only.
4. Before a Next.js code change, read the relevant guide in `node_modules/next/dist/docs/`; this project is Next.js 16.2.9 and conventions may differ from older versions.
5. Preserve URLs, role boundaries, API contracts, and existing user changes unless the task explicitly changes them. Prefer the smallest safe diff.

## Technology and structure

- Next.js 16.2.9 App Router, React 19.2.4, strict TypeScript.
- PostgreSQL + Prisma 6.19.3; all DB access uses `@/lib/prisma`; no raw SQL or other ORM.
- NextAuth v5 beta with JWT sessions and Prisma adapter.
- Custom RBAC; Zod v4 validation; Tailwind v4, shadcn/radix-nova, Radix UI, Lucide, Sonner.
- SSLCommerz payments and ImageBB/sharp image handling.
- Tests: Vitest, Testing Library, jsdom, MSW.

```text
src/app          App Router pages, layouts, APIs, cross-cutting actions
src/features     domain services/actions/types/context
src/components   UI primitives, shared UI, domain components
src/lib          Prisma, auth/authz, validation, payments, utilities
prisma           schema, migrations, seed
tests            unit, integration, component tests
Agentic-Workflow project guidance and historical memory
```

New feature modules belong under `src/features/[feature]` and normally have actions, queries, types, and (only when needed) context. Feature mutations live in feature actions; cross-cutting actions belong in `src/app/actions`. API handlers live in `src/app/api/**/route.ts` and use `NextResponse`.

## Route and shell topology

```text
src/app/
├─ layout.tsx                       global providers/infrastructure
├─ (customer)/                      public storefront, cart, checkout, profile
│  ├─ (public)/
│  ├─ (protected)/                  cart, checkout, orders; server role guard
│  ├─ (user)/                       profile; server role guard
│  └─ checkout/                     payment result pages
├─ (admin)/admin/*                  AdminShell; no customer cart/shell
├─ (auth)/*                         minimal auth pages/shell
└─ store-manager/*                  StoreManagerShell; no customer cart/shell
```

Route groups do not affect URLs. Intended shell ownership: customer → `AppShell` + `CartProvider`; admin → `AdminShell`; store manager → `StoreManagerShell`; auth → minimal layout. Never place customer cart/search UI into admin or store-manager areas.

`src/proxy.ts` handles limited path redirects (not general API protection). Each protected page, server action, and route handler must provide its own appropriate authentication/authorization.

## Authentication and authorization contract

`src/lib/auth.ts` is the NextAuth source: Google, Facebook, and credentials providers; JWT session; session includes `user.id`, `user.role`, and `user.permissions`. New users without a role are assigned `user` on sign-in. Credentials require a matching password but do not currently gate on `emailVerified`: legacy and seeded credential users have `emailVerified = null`, and the current resend-verification action requires an authenticated session. Do not restore that gate until a migration/rollout policy and unauthenticated resend flow exist.

Keep these concerns distinct:

```text
role            who/which application area: user | admin | store_manager
permission      allowed capability: food:update, order:view, store:update, etc.
resource scope  which record: user ownership or managedStore ownership
```

- Determine role only with `session.user.role` (or `getUserRole`). Never infer it from `admin:access`, `store:view`, or another permission.
- Server routes/actions should follow: `auth()` → role check → permission check → ownership/store-scope check → Zod validation → mutation.
- Hidden UI and client-side permission hooks are not security controls.
- Keep one redirect owner per route boundary. Avoid proxy/page/layout redirect chains and cross-redirects between admin and store-manager areas.
- Use `authorize`, `requirePermission`, `authorizeRole`, and `requireRole` from `@/lib/authorize`; do not create ad-hoc authorization logic.

## Current auth/session/provider behavior

Root layout calls `await auth()` server-side and renders:

```text
ThemeProvider
└─ AuthProvider(initialSession=server session)
   └─ route content + Toaster
```

The customer layout owns `UserDataProvider`; `AppShell` owns `CartProvider`. Do not add a second theme/auth provider. Both customer state providers are keyed by session identity, so logout/account switches clear prior state before reloading for the new identity.

`UserDataProvider` begins with null profile, empty addresses, and loading true; it automatically fetches `GET /api/user/me` after a stable authenticated session and exposes `refresh()` for explicit updates.

## Cart, address, store, and checkout ownership

- `Cart`/`CartItem` are database records. Authenticated carts use `userId`; guest carts use the HTTP-only `chaatwala_guest_id` cookie. `CartProvider` starts empty and fetches `GET /api/cart` after mount. Do not add browser storage as a second cart source of truth.
- Cart item APIs currently resolve the owner before PATCH/DELETE; verify this remains true before relying on historical P0 reports that said otherwise.
- Addresses are database records owned by `userId`. `GET /api/user/me` returns profile plus addresses. The checkout defaults to the DB default address (or first address); any alternate selection is only local page state and does not persist independently.
- Cart/checkout share `useStoreSelection`. It persists the selected store as `chaatwala:selected-store:<userId-or-guest>`, removes the key when cleared or no longer valid, and displays retryable errors for store loading/availability validation. Checkout is blocked while store data/validation is unknown.
- Checkout eligibility is derived, not persisted: cart nonempty + address + selected store + valid stock + not currently placing payment.
- Payment initiate accepts `storeId`, optional saved `addressId`, and shipping-address fields. A supplied address ID is verified against the authenticated user and persisted on the order; it uses an idempotency key and clears the cart before gateway redirection.
- SSLCommerz returns `val_id` to the success callback. `checkout/success` must submit that value as `application/x-www-form-urlencoded` to `/api/payment/validate`; do not substitute `tran_id` or send JSON. A callback without `val_id` must render an error, not a perpetual loading state.

## Database and API rules

- Prisma models use `cuid()` IDs, timestamps, camelCase fields, and `Decimal` money. Convert Decimal to `Number` only at API/UI boundaries.
- Use `findUnique` for genuinely unique lookups, `findFirst` for non-unique conditions, explicit ordering for deterministic lists, `select` for lean return shapes, and `include` to prevent N+1 queries.
- Schema change → generate a Prisma migration; never hand-edit a migration or instantiate `PrismaClient` outside `@/lib/prisma`.
- Validate every external input with Zod before write side effects. `safeParse` is preferable for structured API 400 responses; actions may use `parse` when throwing is appropriate.
- Return serialized plain JSON, not raw Prisma model values or errors. Sensitive mutations should produce audit logs where the existing feature pattern supports it.

## UI and styling rules

- Server component by default; client component only for interaction. Prefer server page/layout → feature/service → Prisma → props → client leaf.
- Avoid client `useEffect` fetching when equivalent data is already available server-side; do not add APIs merely to transfer server data to the client.
- `src/components/ui` is for base shadcn primitives. Prefer a wrapper/domain component over modifying it.
- Use `@/` aliases, PascalCase component files/exports, kebab-case utilities, `cn()` for dynamic class composition, CVA for reusable variants, Tailwind tokens/CSS variables, Lucide icons, Sonner toasts, and Radix primitives for accessible interactive controls.
- No global state library, inline styles, CSS modules, external client API calls, arbitrary hard-coded theme colors, `any`, or `dangerouslySetInnerHTML` without sanitization.
- `ThemeProvider` initializes once from `localStorage["chaatwala-theme"]`; its effect only applies/persists the current value. Never read storage and call `setTheme` from the `[theme]` effect, which causes a saved opposite theme to toggle forever and surfaces as a NavigationMenu maximum-update-depth error.

## Performance context

Measure before optimizing: production build, route timing, browser requests, bundle size, DB query count, cache behavior, and UX metrics where relevant. Historical observations are not permanent facts:

- root `auth()` makes pages dynamic, so `unstable_cache` is the practical read-cache layer;
- related products was previously uncached;
- search issues multiple `ILIKE` queries;
- a Neon configuration previously had `connection_limit=1`, serializing otherwise parallel Prisma calls;
- customer bundle was relatively large.

Keep catalog reads cached, cache repeated read-heavy services, and use dynamic imports only for non-critical interactivity. Never change caching/connection settings without fresh measurements. A performance report must state before/after request count, DB queries, server time, client JS, cache-freshness tradeoffs, and complexity.

## Security items requiring source verification

Historical security findings are leads, not facts. Before changing, inspect source and test these explicitly:

1. Cart item PATCH/DELETE authentication and authenticated/guest ownership.
2. Upload route authentication, validation, size/type limits, and rate limiting.
3. Payment callback provider authentication/signature validation and idempotency (provider callbacks must not be protected with an ordinary browser-session requirement).
4. Whether store-manager routes are store-manager-only or may legitimately admit admins; enforce managed-store scope on data access.
5. Sign-in redirect competition; authenticated change-password authorization.

For protected APIs, check: anonymous → 401/403; wrong role → 403; right role/wrong resource → 403/404; right role/right resource → success; malformed input → 400/422; repeat mutations → rate limit/idempotency behavior.

## Implementation and validation protocol

Before editing, inspect `package.json`, relevant route/layout, auth helpers, feature service/actions, API endpoint, Prisma schema where data is involved, targeted tests, and relevant audits. Make a plan containing:

```text
Goal; current behavior; root cause; files; security impact;
performance impact; implementation plan; validation plan.
```

After implementation, inspect `git diff --check`, `git diff --stat`, and `git diff`. Run the smallest relevant commands that exist in `package.json` (`npm test`, `npm run lint`, `npm run build`; there is currently no `typecheck` script). For security work, add direct endpoint tests. For schema changes, run Prisma generation/migration steps appropriate to the request.

For cart/checkout/auth changes, explicitly test sign-in, add product, select store, add/select address, checkout eligibility, browser refresh, logout/login, wrong-role access, slow network/session, and API failure. Confirm admin/store-manager do not request cart/search and no repeated `/api/user/me` requests appear.

Finish work with: completed items, changed files, validation, known limitations, and one bounded next recommended task. Use focused commits only; never mix security fixes with cosmetic work.
