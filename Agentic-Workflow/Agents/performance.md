# Chaatwala Performance Rules

## Measure first

Before optimization, collect:

- production `next build`
- route response timing
- browser Network requests
- client JS bundle size
- DB query count
- cache hit/miss behavior
- LCP/INP/CLS where applicable

## Known baseline

Historical profiling showed approximately:
- homepage HTTP TTFB in the tens of milliseconds when caches were warm,
- product detail TTFB also low with cached product data,
- uncached related-products work remained on product detail,
- search was around 700–800ms with multiple ILIKE queries,
- homepage JS was around 800KB plus CSS.

Treat these as baseline evidence, not permanent facts.

## Do

- Keep public catalog data cached.
- Cache repeated read-heavy service functions.
- Keep admin/store-manager isolated from customer providers.
- Keep interactive UI client-side only where needed.
- Pass server-fetched initial data into client components.
- Use dynamic imports for genuinely non-critical interactive components.

## Do not

- Convert every server component into a client component.
- Add API calls merely to move data from server to client.
- Add `useEffect` for data already available on the server.
- Move auth/session fetching casually.
- Change caching semantics without measuring.
- Increase database connections blindly.

## Search

Current search uses multiple product tables and substring matching. At small catalog size this may be acceptable.

At scale, investigate:
- PostgreSQL trigram indexes,
- full-text search,
- unified searchable projection,
- cache strategy.

Do not introduce a search engine prematurely.

## Database

If Prisma uses a pooled connection configuration, verify actual production connection limits before changing `connection_limit`.

`Promise.all()` does not guarantee DB-level parallelism if the connection pool only permits one active connection.

## Performance acceptance

A performance task should report:

```text
Before:
- request count
- DB queries
- server time
- client JS

After:
- request count
- DB queries
- server time
- client JS

Trade-offs:
- cache freshness
- complexity
- correctness/security impact
```
