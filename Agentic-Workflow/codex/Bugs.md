# Fresh Bug Audit — 2026-08-29

This audit uses the current customer/staff architecture and canonical `Food` model. It excludes retired admin, store-manager, and Dish/Drink/Combo behavior.

## P0 — Duplicate payment validation can deduct the cart twice

- **Files:** `src/app/api/payment/validate/route.ts:32-45`
- **Evidence:** Two concurrent callbacks can both read `attempt.order.paymentStatus !== "paid"` before either update commits. Both then mark the order paid and each calls `removeOrderedCartQuantities` outside the transaction.
- **Impact:** A duplicated SSLCommerz redirect/IPN can remove a second matching quantity from the customer cart, including items added after checkout started.
- **Fix direction:** Claim the pending attempt/order atomically inside an interactive transaction (conditional update on pending state); only the successful claimant may update order status and deduct cart quantities. Make cart deduction part of that same transaction and key it to the ordered cart snapshot.

## P1 — A signed-in customer can accumulate multiple carts

- **Files:** `prisma/schema.prisma:135-146`, `src/app/api/cart/route.ts`, `src/features/cart/service.ts`, `src/features/cart/actions.ts`
- **Evidence:** `Cart.userId` has only an index, not a unique constraint. Every customer-cart lookup uses `findFirst({ where: { userId } })`; concurrent first requests can both create carts, and later reads select an arbitrary cart.
- **Impact:** Items, totals, checkout orders, and payment cart deduction can operate on different carts for the same customer.
- **Fix direction:** Enforce one customer cart at the database level (unique nullable `userId`), migrate/deduplicate existing customer carts, then use `findUnique`/upsert-style acquisition with a unique-constraint retry.

## P1 — Several staff-only server actions enforce permission but not staff workspace

- **Files:** `src/features/stores/actions.ts:107-296`, `src/features/food/actions.ts:51-55`, `src/app/actions/rbac.ts:8-209`, `src/features/address/actions.ts:20-208`
- **Evidence:** These callable server actions use `requirePermission` or only `auth()` without first enforcing `requireWorkspace("staff")` or `workspace === "customer"`. `requirePermission` itself checks only token permissions.
- **Impact:** This breaks the project’s required role-boundary rule. A future permission-seeding mistake or stale customer token could expose staff mutations; address actions also allow a staff session to create customer address data if invoked directly.
- **Fix direction:** Centralize `requireStaffPermission()` and `requireCustomerWorkspace()` helpers, then apply them to every server action before data access/mutation. Retire or separately protect legacy `app/actions/rbac.ts` actions that no longer have UI routes.

## P1 — Public forgot-password flow can reset staff credentials

- **Files:** `src/app/actions/password.ts:16-106`, `src/app/(auth)/forgot-password/page.tsx`
- **Evidence:** `forgotPassword` looks up any user by email and creates reset/set-password tokens without checking `staffRole`; `resetPassword` then updates that user’s password. Staff accounts can have optional contact email.
- **Impact:** This bypasses the planned staff credential-management boundary if staff password recovery is intended to be controlled by Super Admin rather than customer-facing auth pages.
- **Fix direction:** Decide the policy explicitly. If staff recovery is Super Admin-only, exclude `staffRoleId != null` from public reset and return the same non-enumerating success message. Otherwise create a separate staff recovery route with staff-specific controls and audit logging.

## P2 — Customer registration has no abuse/rate-limit protection

- **Files:** `src/app/actions/auth.ts:11-43`
- **Evidence:** `registerUser` performs password hashing, user creation, verification-token creation, and email delivery without a rate-limit check or duplicate-email error handling.
- **Impact:** Automated requests can consume compute/email quota; duplicate registration can surface a generic server-action failure instead of a controlled response.
- **Fix direction:** Rate-limit by normalized email plus client/IP where available; catch unique-email violations and return a neutral, user-safe response.

## Audit validation

- `npm test`: 14 passing tests across 7 current-architecture files.
- `npx tsc --noEmit`: passed.
- No application code was changed during this audit.
