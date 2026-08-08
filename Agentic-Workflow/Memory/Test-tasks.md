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

## Should Be Done Next

- **Remove duplicate API calls** — `AddressList` and `UserDashboard` both call `refresh()` on mount, duplicating the `UserDataProvider` fetch. Consolidate so each endpoint is called once per page load.
- **Reduce total requests per user to <10** — Cart page alone triggers `/api/cart`, `/api/user/profile`, and `/api/user/address` from contexts; add search bar and other client fetches to reach the limit quickly.
- **Consolidate client-side data fetching** — Move scattered client fetches (cart, profile, address, search) into fewer server-rendered boundaries or server actions.
- **Fix N+1 / sequential queries** — `payment/initiate/route.ts` fetches product prices sequentially in a `for` loop; parallelize with `Promise.all`.
- **Add request timeouts on external calls** — SSLCommerz, ImgBB, and other outbound `fetch` calls have no `AbortSignal.timeout`; add timeouts and graceful error handling.
- **Add database connection pooling** — `src/lib/prisma.ts` uses a raw `PrismaClient` singleton with no pool config; add PgBouncer or connection-limit/pool-timeout query params.
- **Add rate limiting** — No rate limiting exists on API routes; add edge or middleware-based rate limiting to protect against spikes.
- **Enable compression** — `next.config.ts` has no gzip/brotli compression config; enable in Next.js config or at the deployment layer.
- **Add baseline metrics/logging** — Only one `console.error` exists; add structured logging, response-time tracking, and error-rate monitoring (e.g., Sentry, Datadog, or Vercel Analytics).
- **Add API response caching layer** — `unstable_cache` covers data, but add edge caching (Vercel Edge Config/KV or Redis) for cart, session, and rate-limit state.
- **Profile and fix slow queries** — No query profiling is in place; add logging for queries >100ms and optimize hot paths (payment initiation, order creation).
- **Add load testing** — No k6/Artillery/Gatling scripts exist; run small-load tests (10–50 users) before targeting 1k–10k.
- **Migrate from `unstable_cache` to `cache()`** — `unstable_cache` is used pervasively; plan migration to the stable `cache()` API from `next/cache`.

## Execution Plan: 1k–10k Traffic Readiness

### Phase 1: Eliminate Duplicate Requests (Days 1–2)

**Goal:** Cut client-side request duplication and reduce per-page requests.

- Audit every `useEffect` + `fetch` pair in client components (`CartProvider`, `AddressList`, `UserDashboard`, `SearchBar`, `Navbar`).
- Remove redundant `refresh()` calls where parent contexts already fetch data.
- Consolidate `/api/user/profile` and `/api/user/address` into a single `/api/user/me` endpoint so the client makes one call instead of two.
- Move cart state hydration from client-side `fetch("/api/cart")` into a server component boundary where possible, or server action that preloads cart data.

### Phase 2: Fix Sequential DB Queries (Days 2–3)

**Goal:** Remove N+1 and sequential database access in hot paths.

- In `payment/initiate/route.ts`, replace the sequential `for` loop with a single batched query or `Promise.all` over product lookups.
- Review order creation and cart mutation paths for repeated identical queries; cache IDs in local variables or batch with `Promise.all`.
- Add Prisma query logging to identify any queries exceeding 100ms during local testing.

### Phase 3: Add Timeouts and Error Boundaries (Days 3–4)

**Goal:** Prevent slow external calls from blocking server functions.

- Wrap all outbound `fetch` calls (SSLCommerz, ImgBB, SSO providers) with `AbortSignal.timeout()` and set sensible limits (e.g., 5–10 seconds).
- Add `try/catch` around external calls with graceful degradation (return user-friendly errors instead of 500s).
- Add request-level timeouts on API routes using Next.js middleware or wrapper functions so hung requests are killed early.

### Phase 4: Database Connection Pooling (Days 4–5)

**Goal:** Prevent connection exhaustion under concurrent load.

- Switch PostgreSQL connection string to use PgBouncer in transaction mode (or use a managed pool like Neon/Supabase pooler).
- Update `src/lib/prisma.ts` to respect `connection_limit` and `pool_timeout` via `DATABASE_URL` parameters.
- Verify pool behavior under local load with 50–100 concurrent connections before deploying.

### Phase 5: Add Edge Caching and Rate Limiting (Days 5–7)

**Goal:** Reduce DB load and protect against spikes.

- Deploy edge rate limiting (Vercel Edge Middleware or Upstash Ratelimit) on all `/api/*` routes with tiered limits (stricter for auth/payment, relaxed for public reads).
- Cache public API responses at the edge (`Cache-Control: s-maxage`, `stale-while-revalidate`) — already partially done on search; extend to product endpoints.
- Add Vercel KV or Redis for server-side cart/session caching so repeated reads don’t hit Postgres.

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
