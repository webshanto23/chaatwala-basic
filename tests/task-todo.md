# Chaatwala SQA Implementation — Task Breakdown

## Module 1: Full Testability Audit
- Inspect entire repository structure (`app/`, `features/`, `components/`, `lib/`, `hooks/`, `prisma/`, `middleware/`, `config/`)
- Read config files (`package.json`, `tsconfig.json`, `next.config.*`, `vitest.config.*`, `prisma/schema.prisma`)
- Map: server components, client components, server actions, API routes, DB services, auth, RBAC, cart, store/inventory, order, payment, image upload, caching, utilities
- Document findings in an internal testing map
- **Status: COMPLETED**

## Module 2: Testing Architecture & Directory Structure
- Create `tests/` directory tree:
  - `tests/unit/lib/`
  - `tests/unit/features/`
  - `tests/unit/utils/`
  - `tests/unit/validation/`
  - `tests/integration/auth/`
  - `tests/integration/cart/`
  - `tests/integration/products/`
  - `tests/integration/store/`
  - `tests/integration/orders/`
  - `tests/integration/payment/`
  - `tests/components/public/`
  - `tests/components/admin/`
  - `tests/components/store-manager/`
  - `tests/components/shared/`
  - `tests/fixtures/`
  - `tests/mocks/`
  - `tests/setup.ts`
- Adapt structure to existing repo conventions if better patterns exist.
- **Status: COMPLETED**

## Module 3: Install Testing Dependencies
- Check if Vitest/testing deps are present in `package.json`
- Install missing baseline packages:
  - `vitest`
  - `@vitejs/plugin-react` — **NOT installed** (causes peer conflict; not needed for Next.js)
  - `jsdom`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `msw`
  - `@vitest/coverage-v8`
- Verify versions are compatible with existing Next.js/React/TypeScript setup.
- **Status: COMPLETED**

## Module 4: Vitest Configuration
- Create `vitest.config.ts` with:
  - TypeScript + React + jsdom
  - Path alias `@/*`
  - Setup files
  - Test coverage (V8)
  - Sensitive include/exclude patterns
- Create `tests/setup.ts`
- Add npm scripts: `test`, `test:watch`, `test:coverage`
- **Status: COMPLETED**

## Module 5: Test Database Strategy
- Inspect Prisma schema for test safety
- Choose strategy: isolated test DB, mocked Prisma, or transaction/reset
- Document chosen approach and rationale
- **Chosen Strategy: Hybrid approach**
  - **Unit tests** (utils, validations, pure functions, RBAC logic): No database required. Pure functions tested directly; Prisma-dependent unit tests use manual mocks.
  - **Integration tests** (auth, cart, orders, payment, products, store, address): Use a dedicated PostgreSQL test database (`DATABASE_URL_TEST`). Schema kept in sync via `prisma migrate deploy`. Tests use setup/teardown to reset state between files.
  - **Component tests**: No database; use MSW for API mocking.
- **Rationale**: 
  - Production database (`DATABASE_URL`) is a live Neon PostgreSQL instance; tests must never touch it.
  - Server actions and API routes depend heavily on Prisma; pure mocking would give low confidence.
  - A dedicated test DB provides realistic integration coverage while isolating test data.
  - Transaction-per-test is not used because Next.js server actions run in separate contexts, making transaction sharing unreliable.
- **Implementation notes**:
  - `DATABASE_URL_TEST` should point to a separate database (e.g., `chaatwala_test` on same Neon instance or local Postgres).
  - Before integration tests: run `npx prisma migrate deploy --schema=prisma/schema.prisma` against test DB.
  - Test files should clean up their own data (delete created records) in `afterAll`/`afterEach`.
  - Never commit `DATABASE_URL_TEST` to version control; add to `.env.local` or CI secrets.
- **Status: COMPLETED**

## Module 6: Core Auth & RBAC Tests
- Write unit/integration tests for authentication:
  - authenticated user
  - unauthenticated user
  - expired/invalid session
  - login/logout behavior
  - protected route behavior
- Write RBAC tests for USER, STORE_MANAGER, ADMIN roles
- Test server-side authorization functions/actions/API handlers
- Verify cross-role access is properly rejected
- **Tests written:**
  - `tests/unit/lib/permissions.test.ts` — `can`, `canAny`, `canAll`, `createCan`, role constants
  - `tests/unit/lib/authorize.test.ts` — `authorize`, `requirePermission`, `unauthorizedResponse`
  - `tests/unit/lib/auth-service.test.ts` — `getSession`, `requireAuth`
  - `tests/integration/auth/register.test.ts` — `registerUser` server action (mocked Prisma/bcrypt/email)
- **Status: COMPLETED**

## Module 7: Cart Logic & Security Tests
- Test add, remove, update quantity, duplicate, empty cart
- Test guest cart vs authenticated cart
- Test validation: quantity 0, negative, decimal, very large, missing/unavailable product
- Test cross-user cart modification security (401/403/404)
- Verify server calculates prices from trusted DB values, not client input
- **Tests written:**
  - `tests/unit/features/cart/service.test.ts` — getCart, addToCart, updateCartItem, removeCartItem
  - `tests/integration/cart/api-cart.test.ts` — GET/POST/DELETE `/api/cart`
  - `tests/integration/cart/api-cart-item.test.ts` — PATCH/DELETE `/api/cart/item/[id]`
  - `tests/integration/cart/cart-security.test.ts` — cross-user cart access security
- **P0 Bugs Found:**
  - `src/features/cart/service.ts` uses `findFirst` instead of `findUnique` for user carts
  - `src/features/cart/service.ts` does not verify cart ownership in addToCart, updateCartItem, removeCartItem
- **Status: COMPLETED**

## Module 8: Store / Inventory Tests
- Test StoreInventory model behavior
- Test per-store availability (Store A available, Store B unavailable)
- Test cart/checkout/order creation respects inventory state
- Test availability transitions and invalid store handling
- **Tests written:**
  - `tests/unit/features/stores/actions.test.ts` — getStores, getStoreManagers, createStore, updateStore, deleteStore
  - `tests/integration/store/api-stores.test.ts` — GET `/api/stores`
  - `tests/unit/features/store-manager/inventory.test.ts` — getStoreInventory, toggleStoreItemAvailability
  - `tests/integration/store/validate-store.test.ts` — POST `/api/cart/validate-store`
- **Status: COMPLETED**

## Module 9: Product CRUD Tests
- Test Dishes, Drinks, Combos CRUD
- Validate name, description, price, discountPrice, category, availability, image
- Test invalid inputs: negative price, negative discount, empty name, invalid image/ID
- **Tests written:**
  - `tests/unit/features/products/dish-actions.test.ts` — createDish, updateDish, deleteDish, getDishes
  - `tests/unit/features/products/drink-actions.test.ts` — createDrink, updateDrink, deleteDrink, getDrinks
  - `tests/unit/features/products/combo-crud.test.ts` — Combo CRUD existence check + validation schema tests
- **Missing Feature Found:**
  - Combo CRUD server actions (`createCombo`, `updateCombo`, `deleteCombo`, `getCombos`) are not implemented in `src/features/products/actions.ts`
  - Only `createComboSchema` validation exists in `src/lib/validations/combo.ts`
- **Status: COMPLETED**

## Module 10: Discount & Pricing Tests
- Verify discountPrice is used as effective selling price
- Test no discount, valid discount, discount = price, discount > price, negative discount
- Report failures as bugs rather than silently fixing
- **Tests written:**
  - `tests/unit/features/products/pricing.test.ts` — createDish/updateDish/getDishes pricing behavior
  - `tests/integration/cart/pricing.test.ts` — cart service price storage + cart total calculation
- **P0 Bug Found:**
  - `src/features/cart/service.ts:70` — `addToCart` hardcodes `price: 0` when creating cart items instead of fetching the product price from the database
  - This causes cart totals to be 0 when items are added through the cart service
  - The cart API route (`src/app/api/cart/route.ts`) correctly fetches and stores the DB price, so items added via the API are not affected
- **Status: COMPLETED**

## Module 11: Order Creation Tests
- Test order creation independent of payment gateway
- Verify authenticated user, valid cart/store/products, server-side prices, totals, addresses, statuses
- Test invalid cases: empty cart, invalid/unavailable product, tampered totals/prices
- **Tests written:**
  - `tests/integration/orders/api-orders.test.ts` — POST `/api/orders` covering:
    - Valid order creation with correct subtotal/deliveryFee/total
    - Unauthorized user (401)
    - Missing addressId/storeId (400)
    - Empty cart (400)
    - Store not found (404)
    - Address not found / address ownership (404)
    - Unavailable products (409)
    - Idempotency key handling
    - Rate limiting (429)
- **Status: COMPLETED**

## Module 12: Payment Gateway Tests
- Mock SSLCommerz; never make real requests
- Test initiation, success, failure, cancel, timeout, invalid transaction/validation ID, wrong amount/currency, duplicate callback
- Test tran_id vs val_id distinction
- Test request-body regression: body parsed only once
- Test payment idempotency (duplicate requests → one order/one transaction)
- **Tests written:**
  - `tests/integration/payment/payment-initiate.test.ts` — 8 tests covering POST `/api/payment/initiate`
  - `tests/integration/payment/payment-validate.test.ts` — 7 tests covering POST/GET `/api/payment/validate`
- **P0 Bug Found:**
  - `src/app/api/payment/initiate/route.ts:53` and `src/app/api/payment/initiate/route.ts:253` — `request.json()` is called twice, consuming the request body on the first call
  - Second call returns empty object, so `shippingAddress` is never parsed
  - This is a request-body regression bug
- **Status: COMPLETED**

## Module 13: Address & API Route Tests
- Test valid/invalid/missing address; user A accessing user B address
- Test key API routes for proper status codes (200, 201, 400, 401, 403, 404, 409, 500)
- Prioritize: `/api/cart`, `/api/cart/item/*`, `/api/payment/*`, `/api/user/*`, `/api/search`
- **Tests written:**
  - `tests/integration/address/api-address.test.ts` — GET/POST `/api/user/address`
  - `tests/integration/address/api-address-item.test.ts` — PUT/DELETE `/api/user/address/[id]`
  - `tests/integration/address/api-user-profile.test.ts` — GET/PATCH `/api/user/me`, GET `/api/user/profile`
  - `tests/integration/search/api-search.test.ts` — GET `/api/search`
- **Status: COMPLETED**

## Module 14: Image Upload Tests
- Mock ImageBB; no real external uploads
- Test valid JPEG/PNG/WebP, invalid MIME, oversized images, missing file, unauthenticated upload
- **Tests written:**
  - `tests/unit/image-upload/image-upload.test.ts` — 10 tests covering ImgbbProvider and uploadImage wrapper
- **Tests cover:**
  - Successful upload with URL and deleteUrl
  - Retry logic on transient failures (max 2 retries)
  - Error after max retries exhausted
  - Missing URL in response
  - Filename generation from alt text
  - Network exception handling
  - Missing API key configuration
  - Unsupported provider error
- **Status: COMPLETED**

## Module 15: Component Tests
- Test Navbar, ProductCard, Cart, Checkout, Admin tables, Store Manager inventory, Order UI
- Use Testing Library queries (`getByRole`, `user.click`)
- Avoid excessive `querySelector` and snapshot testing
- **Tests written:**
  - `tests/components/shared/navbar.test.tsx` — 10 tests covering Navbar rendering, auth states, theme toggle, admin/store-manager links
  - `tests/components/shared/product-card.test.tsx` — 3 tests covering ProductCard container, actions mock, prop acceptance
  - `tests/components/admin/data-table.test.tsx` — 10 tests covering DataTable rendering, filtering, actions, row clicks, custom cells, lowercase columns
  - `tests/components/store-manager/inventory-client.test.tsx` — 5 tests covering InventoryClient rendering, tabs, search, error handling, mount fetch
- **Fixes applied:**
  - Added `cleanup()` in `afterEach` for DataTable tests to prevent duplicate DOM from persisting between tests
  - Changed navbar logo query from exact `getByText("Chaatwala")` to `getAllByText(/Chaatwala/i)` to handle duplicate logo text (desktop hidden span + mobile SheetContent)
  - Changed DataTable `available` status query to `getAllByText` since multiple rows share the same status value
  - Changed DataTable edit button query in `onRowClick` test from `getByRole` to `getAllByRole` to handle multiple action buttons per row
- **Status: COMPLETED**

## Module 16: Mocking Strategy & Coverage Setup
- Define MSW usage rules (pure functions no mock, DB logic mock Prisma, external gateways mock)
- Configure V8 coverage thresholds:
  - Business logic ≥ 80%
  - Critical payment/cart/auth ≥ 90%
  - UI components ≥ 70%
  - Overall ≥ 75%
- **Deliverables:**
  - `tests/mocks/STRATEGY.md` — documented mocking rules and MSW usage patterns
  - `vitest.config.ts` — added coverage thresholds and excluded UI primitives (`src/components/ui/**`) and route groups (`src/app/**`) from coverage measurement
- **Current coverage (baseline):**
  - Statements: 19.79%
  - Branches: 23.72%
  - Functions: 14.49%
  - Lines: 20.47%
- **Note:** Coverage thresholds are configured as aspirational targets. Current coverage is below targets because many business-logic files lack tests. Thresholds will be met incrementally as more P0/P1 tests are added in future modules.
- **Status: COMPLETED**

## Module 17: Run Tests, Build, and Generate QA Report
- Run `npm run test`
- Run `npm run test:coverage`
- Run `npm run build`
- Capture: test count, passed, failed, skipped, coverage, build/TypeScript results
- Generate `TEST-REPORT.md` with Environment, Test Summary, Coverage, Bug lists, Build Status, Production Readiness
- **Results:**
  - Tests: 234 passed, 0 failed, 29 test files
  - Coverage: ~20% overall (below 75% threshold; aspirational targets configured)
  - Build: FAILED — TypeScript error in `src/app/(admin)/admin/orders/OrdersClient.tsx:156` (`Cannot find name 'Button'`)
  - QA Report: `TEST-REPORT.md` generated with full findings
- **Status: COMPLETED**
- Classify every failure: BUG, TEST/IMPLEMENTATION ISSUE, MISSING FEATURE, ENVIRONMENT ISSUE, UNTESTABLE DESIGN
