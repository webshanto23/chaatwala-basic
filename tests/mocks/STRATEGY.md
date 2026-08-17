# Mocking Strategy

## Rules

| Layer | Approach | Rationale |
|-------|----------|-----------|
| Pure functions / utils / validations | **No mock** | Deterministic; test directly |
| Business logic unit tests (features/*, lib/*) | **Mock Prisma / dependencies** | Isolate logic from DB and external services |
| API integration tests | **Realistic mocked dependencies** | Exercise route handlers without hitting real services |
| External gateways (SSLCommerz, ImageBB, OAuth) | **Mock via MSW or vi.mock** | Never make real network requests in tests |
| Cart / auth / RBAC contexts in component tests | **Mock contexts with vi.mock** | Component tests focus on rendering, not provider behavior |

## MSW Usage

- Use MSW for HTTP-level mocking in integration tests when the code under test uses `fetch()` or client-side requests.
- Use `vi.mock()` for module-level mocking of server actions, contexts, and utilities.
- Do not mock everything. Prefer real module execution unless the dependency is external, non-deterministic, or stateful.

## What NOT to mock

- Validation schemas (Zod) — test real schema validation.
- Pure helper functions — test real implementation.
- Permission constants and role definitions — test real values.

## Example patterns

- Server action unit test: `vi.mock("@/lib/prisma", () => ({ ... }))`
- API integration test: `msw.http.get("/api/...", ...)`
- Component test: `vi.mock("@/contexts/auth-context", () => ({ ... }))`
- External gateway: `vi.mock("@/lib/sslcommerz", () => ({ ... }))`
