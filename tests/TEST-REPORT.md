# Chaatwala Automated SQA Report

## Environment

| Item | Value |
|------|-------|
| OS | Linux |
| Node | v22.23.1 |
| npm | 12.0.1 |
| Next.js | 16.2.9 |
| React | 19.2.4 |
| Vitest | ^4.1.10 |
| Testing Library | @testing-library/react ^16.3.2 |
| MSW | installed |
| Database | PostgreSQL (Prisma ORM) |
| Report Date | 2026-08-16 |

## Test Summary

| Metric | Count |
|--------|-------|
| Total Tests | 234 |
| Passed | 234 |
| Failed | 0 |
| Skipped | 0 |
| Test Files | 29 passed / 29 total |
| Duration | ~12.3s |

## Coverage

| Metric | % |
|--------|---|
| Statements | 19.79% (423/2137) |
| Branches | 23.72% (348/1467) |
| Functions | 14.49% (79/545) |
| Lines | 20.47% (396/1934) |

**Notes:**
- Coverage excludes `src/components/ui/**` (shadcn/ui primitives) and `src/app/**` (Next.js route groups) as they are not business-logic targets.
- Thresholds configured at 75% for all metrics.
- Current coverage is below thresholds; this is expected because many business-logic files (auth, cart context, orders service, address actions, rate-limit, sslcommerz) lack dedicated tests.
- Highest covered business-logic files:
  - `src/features/cart/service.ts` — 93.75% statements
  - `src/features/products/actions.ts` — 82.95% statements
  - `src/features/stores/actions.ts` — 76.84% statements
  - `src/lib/image-upload/imgbb.ts` — 96.15% statements

## P0 Bugs

### 1. Cross-User Cart Modification (Security)
- **File:** `src/features/cart/service.ts`
- **Description:** `addToCart`, `updateCartItem`, and `removeCartItem` do not verify that the cart belongs to the authenticated user. `findFirst` is used instead of `findUnique` for user cart lookup, which could return the wrong cart if multiple carts exist.
- **Impact:** Any authenticated user could potentially modify another user's cart items.
- **Status:** Unfixed. Tested and reported in Module 7.

### 2. Payment Request Body Double-Consumption
- **File:** `src/app/api/payment/initiate/route.ts:53` and `:253`
- **Description:** `request.json()` is called twice. The first call consumes the request body stream; the second call returns an empty object, so `shippingAddress` is never parsed. Customer shipping details fall back to defaults.
- **Impact:** Orders created via payment initiation always use default shipping address instead of the customer's actual address.
- **Status:** Unfixed. Tested and reported in Module 12.

### 3. Cart Price Hardcoded to Zero
- **File:** `src/features/cart/service.ts:70`
- **Description:** `addToCart` hardcodes `price: 0` when creating new cart items instead of fetching the product price from the database. The cart context total calculation multiplies `item.price * item.quantity`, so items added via the cart service have zero total.
- **Impact:** Cart totals are incorrect when items are added through the cart service.
- **Status:** Unfixed. Tested and reported in Module 10. Note: the cart API route (`src/app/api/cart/route.ts`) correctly fetches DB price, so items added via the API are not affected.

## P1 Bugs

### 1. Discount / Pricing Not Fully Verified
- **Files:** `src/features/products/actions.ts`, `src/features/cart/service.ts`
- **Description:** While `discountPrice` is used in product display and API routes, the cart service hardcodes price to 0 (see P0 #3), making end-to-end discount verification impossible until the cart service is fixed.
- **Status:** Blocked by P0 cart bug.

## Missing Features

### Combo CRUD Not Implemented
- **File:** `src/features/products/actions.ts`
- **Description:** Combo CRUD server actions (`createCombo`, `updateCombo`, `deleteCombo`, `getCombos`) are not implemented. Only `createComboSchema` validation exists in `src/lib/validations/combo.ts`.
- **Impact:** Admin users cannot manage combo products through the intended server-action interface.
- **Status:** Missing feature. Tested and reported in Module 9.

## Security Findings

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| 1 | Cross-user cart modification possible | P0 | `src/features/cart/service.ts` |
| 2 | Payment request body consumed twice | P0 | `src/app/api/payment/initiate/route.ts` |
| 3 | Cart item price hardcoded to 0 | P0 | `src/features/cart/service.ts` |
| 4 | Address ownership enforced in API routes | OK | `src/app/api/user/address/[id]/route.ts` |
| 5 | Admin cart isolation implemented | OK | `src/features/cart/context.tsx` |

## Performance / Testability Findings

| # | Finding | Status |
|---|---------|--------|
| 1 | React Strict Mode disabled to prevent duplicate renders | Implemented |
| 2 | Client-side request deduplication hook added for admin pages | Implemented |
| 3 | Server-side `unstable_cache` with tag invalidation for admin data | Implemented |
| 4 | Cursor-based pagination for admin orders and audit logs | Implemented |
| 5 | Optional Redis fallback for rate limiter | Implemented |
| 6 | Duplicate DOM elements in Navbar require `getAllBy*` queries in tests | Documented |
| 7 | DataTable tests require explicit `cleanup()` to avoid duplicate DOM | Documented |

## Build Status

| Step | Status | Details |
|------|--------|---------|
| Prisma generate | PASS | Generated Prisma Client v6.19.3 |
| Next.js compile | PASS | Compiled successfully in 4.6s |
| TypeScript check | FAIL | `src/app/(admin)/admin/orders/OrdersClient.tsx:156` — `Cannot find name 'Button'` |
| Production build | FAIL | TypeScript error prevents build completion |

**Build Error Detail:**
```
./src/app/(admin)/admin/orders/OrdersClient.tsx:156:12
Type error: Cannot find name 'Button'.
```

The `Button` component is used on line 156 but is not imported in `OrdersClient.tsx`.

## Production Readiness

**VERDICT: NOT READY**

### Automated Test Status
- **Pass rate:** 100% (234/234 tests passing)
- **Coverage:** ~20% overall (below 75% threshold)
- **Test quality:** Good coverage of business-critical paths (auth, RBAC, cart, payment, orders, address, search, image upload, components). However, many business-logic files remain untested.

### Static Code Findings
- **Build fails:** TypeScript error in `OrdersClient.tsx` blocks production build.
- **P0 bugs remain:** 3 critical bugs (cart security, payment body consumption, cart pricing) are reproduced by tests but not fixed in production code.
- **Missing feature:** Combo CRUD interface is incomplete.

### Known Untested Areas
- `src/lib/sslcommerz.ts` — external gateway integration (mocked in tests, but source file itself untested)
- `src/features/orders/service.ts` — order service layer
- `src/features/cart/context.tsx` — cart context provider
- `src/contexts/auth-context.tsx` — auth context provider
- `src/lib/rate-limit.ts` — rate limiting logic
- Most `src/app/**` route handlers and server components

### Recommendations
1. Fix the TypeScript import error in `OrdersClient.tsx` to unblock the build.
2. Fix P0 bugs in cart service and payment initiation before shipping.
3. Implement Combo CRUD or remove the incomplete admin interface.
4. Add tests for `src/features/orders/service.ts` and `src/features/cart/context.tsx` to improve coverage.
5. Address price formatting inconsistency (`$${price}` vs `৳`) across admin and public pages.
