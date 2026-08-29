# Chaatwala Codebase Memory

Last updated: 2026-08-29

## Current architecture

- Next.js 16, React 19, TypeScript, Prisma/PostgreSQL, Tailwind, shadcn/ui.
- The application now has two workspace applications only:
  - Customer: `src/app/(customer)/` owns `AppShell`, `CartProvider`, storefront, checkout, payment, address and profile UI.
  - Staff: `src/app/(staff)/staff/` owns the unified `/staff/*` dashboard shell.
- Auth pages are under `src/app/(auth)/`; customer sign-in is `/sign-in`, staff sign-in is `/staff/sign-in`.
- The legacy `src/app/(admin)`, `src/app/store-manager`, `src/components/admin`, and `src/components/store-manager` directories were physically removed. Do not recreate them.
- Shared staff dashboard UI is now in `src/components/staff/`; staff screen clients are in `src/features/staff-ui/`.

## RBAC and identity

- Role identity comes from `session.user.role`, but authorization is based on database role identity and permissions.
- `Role` is staff-only in practice. `workspace` remains as a compatibility enum but all new roles default to `STAFF`; no customer role records exist.
- `super_admin` is a protected system role identified by `systemKey === "super_admin"`; it is the only staff control-plane authority.
- User model supports customer email authentication and staff username authentication:
  - Customer: email/password and OAuth; `staffRoleId` is always `null`.
  - Staff: username/password with a non-null `staffRoleId`; no invite flow.
- `User` has `username`, nullable contact `email`, `isActive`, `sessionVersion`, and nullable `staffRoleId`. There is no customer role assignment.
- `StaffStoreAccess` is the many-to-many staff/store relation. It supports multiple stores and one optional primary store. Older `Store.managerId` remains transitional data only; do not use it for new work.
- Session/JWT includes derived role name, nullable `staffRoleId`, workspace, permissions, active status, session version, and system role key. Roleless accounts derive the customer role in `src/lib/auth.ts`.
- Important helpers in `src/lib/authorize.ts`: `requireWorkspace`, `requirePermission`, `requireSuperAdmin`, `authorize`, and `unauthorizedResponse`.
- Permissions are code-owned in `src/lib/permissions.ts`; roles receive permission records from the database. Do not add route folders for new roles.

## Staff routes and UI

- `/staff` is the adaptive staff dashboard. Navigation comes from `src/features/staff-navigation/registry.ts` and is filtered by session permissions.
- Super Admin-only: `/staff/access/staff`, `/staff/access/roles`, `/staff/access/permissions`, `/staff/content/homepage`, `/staff/content/about`.
- Permission-protected staff capability routes:
  - products: `/staff/catalog/products/*`
  - orders: `/staff/operations/orders`
  - inventory: `/staff/operations/inventory`
  - stores: `/staff/stores`
  - audit: `/staff/audit`
  - personal security: `/staff/settings` → `/change-password`
- `src/features/access-control/actions.ts` implements staff creation, enable/disable, role/store reassignment, Super Admin password reset, role creation/editing, and permission assignment/removal. Mutations audit, invalidate affected sessions, revalidate staff data, and rate limit control-plane calls.
- Store managers are dynamic staff, not a fixed role: `/staff/stores` only offers active non-system staff who already have matching `StaffStoreAccess` for that exact store. New stores are created without a manager; assign staff access first, then select the manager while editing the store.

## Customer/staff isolation and APIs

- Customer layout redirects any STAFF workspace session to `/staff` before customer providers mount.
- Cart no longer contains admin-specific bypass branches.
- Staff sessions receive 403 from customer cart, checkout, payment initiation, customer orders, profile, addresses, and profile upload APIs.
- Staff APIs live under `src/app/api/staff/`:
  - `/api/staff/orders/[orderId]` verifies workspace, permission, and assigned-store scope (wildcard permission can access all stores).
  - `/api/staff/users/[userId]` requires staff workspace + `user:view`.
- `getOrders` in `src/app/actions/rbac.ts` scopes non-wildcard staff to their `StaffStoreAccess` store IDs.
- `src/features/store-manager/actions.ts` is now a transitional filename only; it uses `requireWorkspace("staff")` and resolves the primary `StaffStoreAccess` record rather than legacy fixed roles. Rename it only in a focused mechanical cleanup.

## Prisma and seed state

- Applied migration: `prisma/migrations/20260829063135_staff_workspace_foundation/`.
- Applied catalog migration: `prisma/migrations/20260829073035_unified_food_catalog/`, followed by `20260829075230_remove_legacy_product_models/`. `Food`, taxonomy, bundle items, and generic store availability are canonical; legacy dish/drink/combo models were removed.
- Applied migration: `prisma/migrations/20260829090000_separate_customer_from_staff_roles/`. It renames `User.roleId` to `User.staffRoleId`, clears legacy customer role links, deletes customer role records, and defaults new roles to `STAFF`.
- Development database was intentionally reset and seeded during this migration; user explicitly authorized it as non-production.
- Seed creates the protected super-admin role and permission assignments only. Super Admin account bootstrap reads `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` from environment variables and hashes the password. Never commit credentials.
- Last checked Prisma migration status: up to date.

## Validation and known debt

- `npm run build` passed after physical legacy-folder cleanup. Build route manifest contains `/staff/*` and no `/admin/*`, `/store-manager/*`, `/api/admin/*`, or `/api/store-manager/*` routes.
- `git diff --check` passed before the latest memory update; rerun after any edits.
- `npm test` currently fails: many fixtures/mocks still assert retired `admin`/`store_manager` roles or omit `requireWorkspace`/`requireSuperAdmin`; one cart integration suite has a NextAuth/Vitest resolver problem for `next/headers`. Do not weaken production authorization to satisfy these tests—migrate test fixtures instead.
- Browser request tracing and the full authorization matrix are still required for final acceptance.

## Working rules

- Preserve customer/staff shell isolation. Root layout must remain global providers only.
- Every protected mutation/API must authenticate, authorize workspace/permission, check store or ownership scope, validate input, mutate, then revalidate caches.
- Reuse `components/staff` and existing shadcn primitives; do not introduce a separate dashboard design system.
- Keep customer URLs unchanged. Do not add legacy redirects; this is a clean development cutover.
- Read `Agentic-Workflow/codex/todo.md` for the detailed migration checklist and remaining validation tasks.

## Customer authentication fix (2026-08-29)

- Public registration no longer looks up or writes a default role. Password reset intentionally only updates the customer password and session version.
- Customer credentials and OAuth reject staff accounts and allow active accounts without `staffRoleId`. This fixes public sign-in for newly registered and password-reset customers.
- Staff credentials require an active account with a `STAFF` role. Staff management queries/actions consistently use `staffRole` / `staffRoleId`.
- Development DB verification after the migration and seed: 2 active password customers had no staff role, 1 staff account existed, and 0 customer role records remained. `npm run build` passed.

## Payment-flow reliability update (2026-08-29)

- The cart is now review-only: it routes customers to `/checkout`; store/address choice and payment initiation live only in checkout.
- `PaymentAttempt` is canonical for gateway transactions. An order may have multiple retry attempts, each with its own unique transaction and validation IDs. Migration: `20260829100000_add_payment_attempts` (applied to the development database).
- `/api/payment/initiate` is customer-only and validates the saved address, open store, canonical food price, and availability. It creates a pending order without clearing the cart, then creates a pending attempt. A gateway-initiation failure marks only that attempt failed and returns the order ID so a retry remains attached to that order.
- `/api/payment/validate` verifies SSLCommerz server-side, checks the exact amount against the attempt, marks the order paid only after validation, and then removes only the ordered quantities from the customer cart. `/api/payment/status` exposes owned attempt status; `/api/payment/outcome` records authenticated customer fail/cancel results.
- Payment callbacks require `PAYMENT_PUBLIC_URL`: a publicly reachable HTTPS base URL. Do not use `NEXTAUTH_URL` when it is localhost. Configure this to a deployed domain or HTTPS tunnel before live/sandbox gateway testing. Never place gateway secrets in source control.
- Validation: touched payment, checkout, cart, and stores files pass ESLint and `git diff --check`. `npm run build` reached the Next font stage but cannot complete in this environment because Google Fonts cannot be downloaded; project-wide TypeScript still contains stale legacy test fixtures/imports from the earlier architecture migration.
# Unified food catalog migration update (2026-08-29)

- Prisma migration `20260829073035_unified_food_catalog` is applied and seeded. It adds Food, taxonomy joins, combo bundle items, and generic per-store availability while retaining legacy product tables during the cutover.
- Canonical staff catalog: `/staff/catalog/foods`; former staff product subroutes were deleted. `Food` actions require staff workspace plus the appropriate `food:*` or taxonomy capability, validate 2–3 unique standard components, calculate prices on the server, audit changes, and clean up uploaded images.
- Customer catalogue is `/products`, with server-rendered `?category=<FoodCategory.slug>` filtering and a responsive category control (desktop shadcn/Radix Tabs, mobile Sheet). Product details are `/products/[id]`; legacy dish/drink/combo routes and components were deleted with no redirects. New cart items use `productType: "food"`; cart creation, order availability validation, and payment recalculation use the canonical Food calculation.
- Generic primary-store inventory is at `/staff/operations/inventory` and writes FoodStoreAvailability. The old StoreInventory feature is still present only as unused legacy source and must be removed in the final cleanup.
- Validation during this increment: `npx tsc --noEmit` was run; the new unified-food files have no TypeScript errors. The project-wide command still reports known stale legacy test/fixture errors. Final build is intentionally deferred by the food migration plan.
