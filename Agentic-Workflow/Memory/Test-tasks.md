# Load-Test Readiness Assessment

## Already Implemented

- **Route/data revalidation (ISR)** — `export const revalidate` is set on public pages (home, product detail, dishes, drinks, combos) and the admin dashboard.
- **Database indexing** — Prisma schema includes indexes on `userId`, `status`, `slug`, `createdAt`, `guestId`, `productId + productType`, and unique constraints on `email`, `slug`, `sslTxnId`, `idempotencyKey`.
- **No overfetching** — API routes and server actions consistently use Prisma `select` to return only required fields.
- **Server-side data caching** — `unstable_cache` is used across products, user profile, addresses, cart, admin users/roles/permissions/orders, and dashboard revenue.
- **Static asset caching via CDN** — Next.js `Image` component with `remotePatterns` is configured; Vercel/Next.js handles static asset CDN caching automatically.
- **Minimal middleware overhead** — `proxy.ts` short-circuits `/api` paths and performs lightweight auth/permission checks with a focused route matcher.
- **Production build scripts** — `build` runs `prisma generate && next build`; `start` runs `next start`.
- **Parallel server-side data fetching** — Home page, sitemap, and search API use `Promise.all` for concurrent DB queries.
- **Cache-Control headers on public APIs** — Search API sets `s-maxage=60, stale-while-revalidate=120`.
- **Consolidated user data fetching** — Replaced duplicate `/api/user/profile` + `/api/user/address` calls with a single `/api/user/me` endpoint; removed duplicate `refresh()` in `AddressList` that was firing alongside `UserDashboard`'s refresh.
- **Timeouts on external calls** — Added `AbortSignal.timeout(10000)` to SSLCommerz initiate/validate fetches, ImgBB upload fetch, and image delete fetch; existing try/catch already provides graceful degradation.
- **Fixed N+1 / sequential queries** — `payment/initiate/route.ts` product price lookups batched into 3 parallel `findMany` calls by type; removed sequential `for` loop with individual `findUnique`.
- **Tiered rate limiting** — Implemented Upstash Ratelimit (`strict` 5/min, `medium` 30/min, `relaxed` 100/min) and applied to payment, order, and cart mutation endpoints.
- **Database connection pooling active** — `DATABASE_URL` uses Neon pooler with `pgbouncer=true`, `connection_limit=1`, and `pool_timeout=20`.

## Should Be Done Next

- **Enable compression** — `next.config.ts` has no gzip/brotli compression config; enable in Next.js config or at the deployment layer.
- **Add baseline metrics/logging** — Only one `console.error` exists; add structured logging, response-time tracking, and error-rate monitoring (e.g., Sentry, Datadog, or Vercel Analytics).
- **Profile and fix slow queries** — No query profiling is in place; add logging for queries >100ms and optimize hot paths (payment initiation, order creation).
- **Add load testing** — No k6/Artillery/Gatling scripts exist; run small-load tests (10–50 users) before targeting 1k–10k.
- **Migrate from `unstable_cache` to `cache()`** — `unstable_cache` is used pervasively; plan migration to the stable `cache()` API from `next/cache`.

## Execution Plan: 1k–10k Traffic Readiness

### Phase 1: Eliminate Duplicate Requests (Days 1–2) ✅ Completed

**Goal:** Cut client-side request duplication and reduce per-page requests.

- Audited every `useEffect` + `fetch` pair in client components (`CartProvider`, `AddressList`, `UserDashboard`, `SearchBar`, `Navbar`).
- Removed redundant `refresh()` calls where parent contexts already fetch data.
- Consolidated `/api/user/profile` and `/api/user/address` into a single `/api/user/me` endpoint so the client makes one call instead of two.
- Moved cart state hydration from client-side `fetch("/api/cart")` into a server component boundary where possible, or server action that preloads cart data.

### Phase 2: Fix Sequential DB Queries (Days 2–3) ✅ Completed

**Goal:** Remove N+1 and sequential database access in hot paths.

- In `payment/initiate/route.ts`, replaced the sequential `for` loop with 3 parallel `findMany` calls grouped by product type (`dish`, `drink`, `combo`), then validated prices via in-memory maps.
- Reviewed order creation and cart mutation paths for repeated identical queries; no N+1 found outside payment initiation.
- Prisma query profiling should be added next to catch >100ms queries during local testing.

### Phase 3: Add Timeouts and Error Boundaries (Days 3–4) ✅ Completed

**Goal:** Prevent slow external calls from blocking server functions.

- Wrapped all outbound `fetch` calls (SSLCommerz initiate/validate, ImgBB upload, image delete) with `AbortSignal.timeout(10000)` (15s for ImgBB upload).
- Verified existing `try/catch` blocks around external calls already provide graceful degradation with user-friendly error messages.
- Next.js built-in request timeouts cover inbound API route/servlet hangs; no custom middleware wrapper added because platform timeouts plus explicit outbound timeouts are sufficient for the current attack surface.

### Phase 4: Database Connection Pooling (Days 4–5) ✅ Completed

**Goal:** Prevent connection exhaustion under concurrent load.

- Verified `DATABASE_URL` is already using Neon pooler with `pgbouncer=true`, `connection_limit=1`, and `pool_timeout=20`.
- No code changes required in `src/lib/prisma.ts` because pooling is handled at the datasource level.

### Phase 5: Add Edge Caching and Rate Limiting (Days 5–7) ✅ Completed

**Goal:** Reduce DB load and protect against spikes.

- Implemented tiered Upstash Ratelimit (`strict` 5/min, `medium` 30/min, `relaxed` 100/min) in `src/lib/rate-limit.ts`.
- Applied `strict` rate limiting to `/api/payment/initiate` and `/api/payment/validate`.
- Applied `strict` rate limiting to `/api/orders` (order creation).
- Applied `medium` rate limiting to `/api/cart` (POST/DELETE) and `/api/cart/item/[id]` (PATCH/DELETE).
- Added `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.example`.
- Verified public API Cache-Control headers exist on `/api/search` and `/api/search/popular`; product pages use ISR + `unstable_cache` at the data layer.
- Redis-backed cart/session caching deferred: `unstable_cache` already covers cart reads; Redis can be added later as an additional edge cache layer if needed.

### Phase 6: Enable Compression and Optimize Build (Day 7)

**Goal:** Reduce payload size and ensure production-only bundle.

- Enable gzip/brotli compression in `next.config.ts` or confirm deployment-layer compression is active.
- Audit `next build` output to confirm no dev-only code or source maps are shipped.
- Review `reactStrictMode: false` — decide if strict mode should be re-enabled for better render safety.

### Phase 7: Baseline Metrics and Monitoring (Days 8–10)

**Goal:** Establish visibility into performance and errors.

- Integrate error tracking (Sentry or equivalent) with performance monitoring enabled.
- Add basic response-time logging on API routes (p95, p99) without adding heavy APM.
- Set up uptime/health checks and database connection pool monitoring.

### Phase 8: Load Testing (Days 10–14)

**Goal:** Validate the system can handle target traffic.

- Write k6 or Artillery scripts simulating 10, 50, 100, 500, and 1k concurrent users.
- Test critical paths: home page load, product search, cart add, checkout initiation.
- Identify breaking points, then iterate on pool sizing, cache TTLs, and query optimization based on results.

### Phase 9: Migrate from `unstable_cache` to `cache()` (Ongoing)

**Goal:** Use stable Next.js caching APIs before they become breaking changes.

- Replace `unstable_cache` imports with `cache()` from `next/cache` across all files.
- Run full regression tests to confirm cache hit rates and revalidation behavior remain correct.
