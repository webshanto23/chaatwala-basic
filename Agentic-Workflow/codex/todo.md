# Architecture Migration Risks and Execution Plan

Status: in progress. Execute one task at a time; do not combine unrelated tasks.

## Current implementation state

- Milestone 1 is implemented in the disposable development database: workspace-aware roles, protected Super Admin identity, staff username/active status, and multi-store access migration are applied and seeded. Its required validation is deferred to the planned milestone checkpoint.
- Milestone 2 is implemented in source: workspace-aware session claims and guards, separate customer/staff credentials, disabled-account enforcement, and workspace home routing. Its required test/build checkpoint is deferred.
- Milestone 3 is implemented in source: Super Admin-only staff creation, activation, role/store reassignment, password reset, role creation/editing, and role-permission add/remove actions include audit entries, session invalidation, system-role protection, and control-plane rate limiting. Focused mutation/security tests remain pending.
- Milestone 4 is implemented in source: the unified staff shell, permission-filtered navigation, dashboard, access-control pages, catalog, orders, inventory, stores, content, audit, and settings routes are present with direct page guards.
- Milestone 5 is implemented in source: the canonical staff order-detail/user-detail APIs replace the legacy APIs; staff order reads are store-scoped; store inventory derives its default operational store from `StaffStoreAccess`; and old admin/store-manager route entry points are removed.
- Milestone 6 is implemented in source: the customer route-group layout rejects staff before mounting customer providers; cart client bypasses were removed; customer-only APIs reject staff sessions. Browser request tracing remains pending.
- Milestone 7 route cutover is implemented: the production build contains no `/admin/*`, `/store-manager/*`, `/api/admin/*`, or `/api/store-manager/*` route. The legacy app/component directories are removed; reusable modules now live in neutral `features/staff-ui` and `components/staff` locations.
- Validation: Prisma migration status is up to date; `git diff --check` passes; production build passes. The full unit suite still has stale legacy-role mocks/expectations and one NextAuth/Vitest resolver failure; update those test fixtures before declaring final test acceptance.

## Unified Food Catalog — planned migration

Status: in progress. This is a development-phase clean break. Do not run the production build until the final milestone.

- Food Milestone 1 foundation is applied: `Food`, staff-managed categories/tags, category/tag assignments, combo bundle items, generic store-food availability, and percentage-discount fields exist in Prisma migration `20260829073035_unified_food_catalog`.
- Default categories (Dish, Drink, Dessert, Snack) and tags (Popular, New, Spicy) are seeded.
- `src/features/food/service.ts` now provides server-side standard/combo price and component/store availability calculation; staff actions enforce the same rules, upload cleanup, auditing, and permission checks.
- `/staff/catalog/foods` is the canonical unified staff catalog. It reuses the existing staff UI and supports standard-food/combo CRUD, manual percentage discounts, category/tag maintenance, and direct route guards. The former staff dish/drink/combo routes are removed.
- `/staff/operations/inventory` now writes generic `FoodStoreAvailability` entries for the staff member's assigned primary store.
- Customer product lists, search, combo list/detail, cart acceptance, checkout availability validation, and payment price validation can now use `productType: "food"`. Existing customer product URLs are retained and select the relevant Food category/kind.
- Legacy product tables and fallback code still remain only for development-cart/order compatibility. Remove them after all stale routes, sitemap/RBAC counters, tests, and existing legacy carts have been migrated.

### Food Milestone 1 — Schema and data migration

1. Replace `Dish`, `Drink`, and `Combo` with `Food`, `FoodCategory`, `FoodTag`, category/tag join tables, and `FoodBundleItem`.
2. Add `FoodKind` (`STANDARD`, `COMBO`), base price, percentage discount, global availability, images, and generic store-food availability records.
3. Migrate existing food records and convert legacy combo item arrays into bundle-item rows; reset/seed the disposable development database if that is safer than backfill.
4. Add indexes for public availability/category/tag queries, slug lookup, and store availability.

**Required validation:** Prisma generate, migration status, seed/data verification, and focused price/bundle relation tests. No full build yet.

### Food Milestone 2 — Pricing, availability, and server services

1. Create one food service/query layer for standard foods and calculated combos.
2. Calculate standard final price from base price and percentage discount; calculate combo price from current component final prices and the combo discount.
3. Enforce bundle rules: 2–3 unique components, no self-reference/cycles, and no direct client-provided combo price.
4. Replace product-type inventory logic with generic per-food store availability; make combo availability depend on its components.
5. Update cart, checkout, payment, and order creation to validate availability and snapshot calculated final prices.

**Required validation:** focused unit/integration tests for prices, discount boundaries, unavailable components, wrong-store requests, cart snapshots, and checkout revalidation. No full build yet.

### Food Milestone 3 — Staff catalog and taxonomy control plane

1. Replace separate dish/drink/combo staff screens with a unified `/staff/catalog/foods` screen using the existing staff UI patterns.
2. Add Super Admin or permission-guarded category/tag maintenance screens; ordinary staff receives access only through `food-category:manage` and `food-tag:manage` permissions.
3. Implement standard-food CRUD, combo composition CRUD, image upload cleanup, auditing, cache invalidation, and direct-URL guards.
4. Replace primary-store legacy inventory screen with generic food availability controls for the assigned primary store.

**Required validation:** staff permission, direct URL, category/tag, combo deletion, bundle validation, and store-scope tests. No full build yet.

### Food Milestone 4 — Customer catalog and cleanup

1. Replace static `sitedata.json` combos and separate dish/drink public paths with database-backed unified food queries and category/tag filters.
2. Make public lists/search/detail pages consistently hide globally unavailable food; preserve existing customer URLs where practical or remove obsolete product URLs as a clean development cutover.
3. Remove all legacy product models, actions, components, validation schemas, inventory code, static product data, and stale tests only after their unified replacements are used.
4. Update codex memory and route/API documentation.

**Required validation:** full unit/integration suite migration, Prisma status, route/API authorization matrix, browser cart/checkout trace, `git diff --check`, and one final `npm run build` after all food milestones are complete.

## UI reuse decision

- Reuse the existing dashboard visual language and components for both customer and staff experiences. Do not create a new dashboard design system.
- Reuse existing shells, cards, data tables, forms, dialogs, buttons, sidebar patterns, and shadcn primitives wherever they fit.
- New staff screens compose or extend existing reusable components; extract shared components only when the same UI behavior is genuinely used by more than one feature.
- Route and RBAC refactoring must not trigger unrelated dashboard visual redesign work.

## Risks to control

- Role, route, session, customer-provider, and managed-store behavior is currently broadly coupled; partial changes can cause login loops, lost access, or 403 errors.
- Separate customer email and staff username authentication changes Prisma, NextAuth, validation, password flows, and OAuth boundaries.
- Dynamic roles and multi-store scope need consistent server-side authorization. A missing scope check can expose another store's data.
- The clean development cutover intentionally removes `/admin/*` and `/store-manager/*`; old route references must be removed before deletion.
- Super Admin is high-risk: bootstrap, system-role protection, final-active-admin protection, audit logging, rate limiting, and transactions must be correct.

## Milestone 0 — Baseline and capability map

1. Record the current production-build, test, and migration status.
2. Inventory every `/admin/*` and `/store-manager/*` page, action, API, sidebar link, and role-dependent client branch.
3. Map each current staff capability to its canonical `/staff/*` destination and required permission.
4. Record baseline browser requests for customer, admin, and store-manager sessions, including cart/search/profile calls.

**Required validation:** full test suite, production build, Prisma migration status, and a saved route/API authorization matrix.

## Milestone 1 — Database identity foundation

1. Define the final Prisma schema changes: role workspace/system metadata, staff username, optional staff contact email, active status, and multi-store staff access with optional primary store.
2. Define exact data handling for current development records and decide whether the disposable development database is reset/seeded or backfilled.
3. Implement and apply the Prisma migration only after the schema design is final.
4. Update seed/bootstrap behavior: seeded customer role, protected Super Admin system role, and Super Admin credentials read from environment configuration and hashed before storage.
5. Remove fixed runtime role mapping assumptions while preserving the code-owned permission catalogue.

**Required validation:** Prisma generate, migration status, seed run, schema inspection, and focused role/store relation tests. Run full build/test at the end of this milestone.

## Milestone 2 — Authentication and authorization core

1. Extend session/JWT claims with role ID, role name, workspace, permissions, active status, and session version.
2. Add workspace-aware authorization helpers; keep role, permission, and resource/store scope checks distinct.
3. Split credentials entry points: customer email/password at `/sign-in`; staff username/password at `/staff/sign-in`.
4. Ensure customer OAuth cannot create or authenticate staff accounts, and staff username sign-in cannot authenticate customer accounts.
5. Add disabled-account denial and session-version invalidation for role, permission, password, and active-status changes.
6. Replace hard-coded role-home branching with workspace home routing.

**Required validation:** focused auth/session/authorization tests after each risky helper change; full test suite and production build at milestone completion.

## Milestone 3 — Super Admin control plane

1. Create the Super Admin server authorization guard using protected system-role identity.
2. Build staff creation action: name, normalized username, permanent password hash, staff role, optional contact email, and store assignments.
3. Build staff enable/disable, role reassignment, multi-store assignment, and password-reset actions.
4. Build staff self-service password change requiring current password.
5. Implement role creation/editing and role-permission assignment from the approved permission catalogue.
6. Protect Super Admin from deletion/demotion/self-editing and protect the final active Super Admin in a transaction.
7. Add audit logging and rate limiting for every high-risk control-plane action.

**Required validation:** focused unit/integration tests for every mutation; security matrix tests for anonymous, customer, ordinary staff, Super Admin, wrong store, and final-Super-Admin cases. Run full build/test at milestone completion.

## Milestone 4 — Dedicated staff shell and navigation

1. Create the canonical `(staff)/staff/layout.tsx` workspace boundary.
2. Create the code-owned staff capability/navigation registry with safe paths, labels, icons, sections, and required permissions.
3. Build permission-filtered staff sidebar and adaptive `/staff` dashboard.
4. Add thin page entry points for catalog, operations, stores, content, access control, audit, and settings; place screens/actions/queries in feature modules.
5. Add focused Super Admin pages: `/staff/access/staff`, `/staff/access/roles`, and `/staff/access/permissions`.

**Required validation:** staff route access tests, navigation visibility tests, direct URL denial tests, and one production build.

## Milestone 5 — Capability migration

Perform these as separate small tasks. Do not delete the legacy implementation until its staff equivalent passes focused tests.

1. Migrate catalog/products and its server mutations.
2. Migrate stores and staff store-scope management.
3. Migrate operations/orders with role/permission/store-scope checks.
4. Migrate inventory and store-scoped food management.
5. Migrate content/homepage and content/about.
6. Migrate audit and settings.
7. After each capability, update internal links and remove its old role-specific client branches.

**Required validation:** focused tests for each completed capability. Run full build/test after steps 3 and 6.

## Milestone 6 — Customer/staff isolation

1. Make customer layout the sole owner of `AppShell`, `CartProvider`, customer data provider, customer search, floating cart, checkout, and payment UI.
2. Remove client role checks used only to hide or clear customer cart UI for staff.
3. Enforce customer workspace on cart, checkout, payment, address, and customer-order APIs while preserving explicitly intended guest-cart behavior.
4. Verify staff layouts do not import customer providers or customer-only UI.
5. Measure customer/staff browser requests and fix any staff cart, search, payment, profile, or checkout calls.

**Required validation:** API authorization tests, browser request trace for each workspace, full test suite, production build, and bundle/request comparison against Milestone 0.

## Milestone 7 — Clean cutover and deletion

1. Confirm every legacy admin/store-manager capability exists and passes at its `/staff/*` destination.
2. Remove `/admin/*`, `/store-manager/*`, their layouts, shells, sidebars, duplicate pages, and obsolete role redirects.
3. Remove stale route references from sign-in, access-denied, proxy, robots/sitemap, tests, and documentation.
4. Run a route crawl/search to confirm no internal legacy URLs remain.

**Required validation:** full test suite, production build, lint, Prisma migration status, route crawl, authorization matrix, and final browser request trace.

## Final acceptance checks

- Exactly two dashboard applications remain: customer and staff.
- Only Super Admin can create staff roles and staff users.
- New ordinary staff roles require database configuration, not new route folders/shells/sidebar code.
- Staff users authenticate only with username/password and cannot use customer email/OAuth flows.
- Customer and staff providers, APIs, and browser requests are isolated.
- Every protected operation enforces workspace, permission, and ownership/store scope on the server.
- No `/admin/*` or `/store-manager/*` route remains.
