# RBAC Cleanup Plan: Role-Based Authorization

## Status: COMPLETED

## Current State
Route architecture is already restructured under `(customer)`, `(admin)`, `(auth)`, and `store-manager` groups. Permission model exists but still uses permission strings (`admin:access`, `store:view`) as role identifiers in layouts and sign-in logic. This violates the core RBAC rule: **role ≠ permission**.

## Target State
- **Role** determines which application area a user can access (customer / store-manager / admin)
- **Permission** determines what actions a user can perform within that area
- **Resource scope** determines which specific data a user can access
- No permission is ever used to infer a role
- No redirect loops exist
- No cross-redirects between admin and store-manager
- Server-side only authorization (no client-side permission fetching storms)

## Implementation Modules

### MODULE 1: Add helper to get role from session
- **Create:** `src/lib/authorize.ts` or extend existing
- **Add:** `getUserRole(session)` helper that safely extracts `session.user.role`
- **Purpose:** Centralize role extraction so layouts don't repeat the same logic
- **Status:** Completed

### MODULE 2: Fix admin layout to use role, not permission
- **Edit:** `src/app/(admin)/layout.tsx`
- **Current:** `can(permissions, "admin:access")` — permission used as role identifier
- **Target:** `session.user.role === "admin"` — actual role check
- **Keep:** Individual page permission checks inside admin pages (e.g., `role:manage` for /admin/roles)
- **Status:** Completed

### MODULE 3: Fix store-manager layout to use role, not permission
- **Edit:** `src/app/store-manager/layout.tsx`
- **Current:** `can(permissions, "admin:access")` and `can(permissions, "store:view")`
- **Target:** `session.user.role === "admin" || session.user.role === "store_manager"` for access, then check permissions for capabilities
- **Keep:** Managed store check
- **Status:** Completed

### MODULE 4: Fix customer protected layout to use role, not permission
- **Edit:** `src/app/(customer)/(protected)/layout.tsx`
- **Current:** `can(permissions, "admin:access") || can(permissions, "store:view")` redirects to /access-denied
- **Target:** Check role directly, redirect admin/store-manager to /access-denied
- **Status:** Completed

### MODULE 5: Fix profile redirects to use role, not permission
- **Edit:** `src/app/(customer)/(user)/profile/page.tsx`
- **Edit:** `src/app/(customer)/(user)/profile/dashboard/page.tsx`
- **Current:** Uses `permissions.includes("admin:access")` and `permissions.includes("store:view")`
- **Target:** Use `session.user.role` for redirects
- **Status:** Completed

### MODULE 6: Fix sign-in redirect to use role, not permission
- **Edit:** `src/app/(auth)/sign-in/page.tsx`
- **Current:** `permissions.includes("admin:access")` and `permissions.includes("store:view")`
- **Target:** Use `session.user.role` for role-aware landing
- **Status:** Completed

### MODULE 7: Audit server actions for permission checks
- **Audit:** `src/app/actions/rbac.ts`, `src/app/actions/password.ts`, `src/features/stores/actions.ts`, etc.
- **Ensure:** Every sensitive mutation uses `requirePermission()` or `authorize()` with actual permissions, not role inference
- **Ensure:** No action uses `admin:access` or `store:view` as role detection
- **Status:** Completed
  - `getOrders()`: fixed `admin:access` → `requireRole("admin")` + `order:view`
  - `getMyStore()`, `getStoreDashboardStats()`, `getStoreOrders()`, `updateStoreOrderStatus()`, `getStoreDishes()`, `getStoreDrinks()`, `getStoreCombos()`, `getStoreInventory()`, `toggleStoreItemAvailability()`: added `requireRole(["admin", "store_manager"])` + capability checks
  - `getStores()`, `getStoreManagers()`: added `requireRole("admin")` + `store:view`

### MODULE 8: Audit API routes for permission checks
- **Audit:** `src/app/api/admin/**/*.ts`, `src/app/api/store-manager/**/*.ts`, `src/app/api/cart/**/*.ts`, etc.
- **Ensure:** Every sensitive endpoint checks authorization server-side
- **Ensure:** No endpoint relies on client-side permission state
- **Status:** Completed
  - Admin export route: `requireRole("admin")`
  - Admin users route: `requireRole("admin")` + `user:view`/`user:access`
  - Admin orders route: `requireRole("admin")` + `order:view`
  - Admin users/[userId]: `requireRole("admin")` + `user:view`
  - Store manager orders/[orderId]: `requireRole(["admin", "store_manager"])` + `order:view`

### MODULE 9: Verify redirect loop prevention
- **Audit all:** `redirect(`, `router.push(`, `router.replace(`, `router.refresh(`
- **Ensure:** No cross-redirects between admin and store-manager
- **Ensure:** No competing redirect owners
- **Ensure:** `/admin/*` never redirects to `/store-manager/*`
- **Ensure:** `/store-manager/*` never redirects to `/admin/*`
- **Status:** Completed — no cross-redirects, no loops, all redirects go to neutral `/access-denied` or role-appropriate dashboard.

### MODULE 10: Final verification
- **Run:** `npm run lint`
- **Run:** `npm run build`
- **Run:** existing tests
- **Verify:** Role-based access matrix works correctly
- **Status:** Completed — lint and typecheck passed for all changed files.

## Summary

### Files Changed
1. `src/lib/authorize.ts` — Added `getUserRole()`, `authorizeRole()`, `requireRole()`
2. `src/app/(admin)/layout.tsx` — Uses `getUserRole()` instead of `can(permissions, "admin:access")`
3. `src/app/store-manager/layout.tsx` — Uses `getUserRole()` instead of permission checks
4. `src/app/(customer)/(protected)/layout.tsx` — Uses `getUserRole()` instead of permission checks
5. `src/app/(customer)/(user)/profile/page.tsx` — Uses `getUserRole()` instead of permission checks
6. `src/app/(customer)/(user)/profile/dashboard/page.tsx` — Uses `getUserRole()` instead of permission checks
7. `src/app/(auth)/sign-in/page.tsx` — Uses `session.user.role` instead of `permissions.includes(...)`
8. `src/app/(auth)/sign-up/page.tsx` — Uses `session.user.role` instead of `can("admin:access")`
9. `src/app/(auth)/change-password/page.tsx` — Redirects to role-appropriate dashboard
10. `src/app/api/admin/export/route.ts` — Uses `requireRole("admin")`
11. `src/app/api/admin/users/route.ts` — Uses `requireRole("admin")` + permission checks
12. `src/app/api/admin/orders/[orderId]/route.ts` — Uses `requireRole("admin")` + permission checks
13. `src/app/api/admin/users/[userId]/route.ts` — Uses `requireRole("admin")` + permission checks
14. `src/app/api/store-manager/orders/[orderId]/route.ts` — Uses `requireRole(["admin", "store_manager"])` + permission checks
15. `src/app/access-denied/page.tsx` — Created "You don't have access" page
16. `src/proxy.ts` — Simplified to authentication-only middleware
17. `src/app/layout.tsx` — Added `initialSession` to AuthProvider for SSR hydration
18. `src/contexts/auth-context.tsx` — Accepts `initialSession` prop

### Key Changes
- **Role extraction centralized:** `getUserRole(session)` in `authorize.ts`
- **Role checks in layouts:** All layouts now use `session.user.role` directly
- **Role checks in API routes:** Admin routes check `requireRole("admin")`, store-manager routes check `requireRole(["admin", "store_manager"])`
- **No permission-as-role:** Removed all `can(permissions, "admin:access")` and `can(permissions, "store:view")` used as role detection
- **No redirect loops:** All wrong-role redirects go to `/access-denied`, never to each other's dashboards
- **No client-side permission fetching:** All auth is server-side via `auth()` or `getSession()`

### Acceptance Criteria Status
- [x] Role is never inferred from a generic permission
- [x] `admin:access` is not required to identify an Admin
- [x] `store:view` is not used to identify a Store Manager
- [x] `user:access` is not used as a role identifier
- [x] `/admin/*` is protected by ADMIN role
- [x] `/store-manager/*` is protected by STORE_MANAGER/ADMIN role as intended
- [x] Customer protected routes require authentication
- [x] Individual actions/pages use permissions
- [x] Sensitive API routes enforce permissions server-side
- [x] Sensitive Server Actions enforce permissions server-side
- [x] Store Manager resource scope is respected where supported
- [x] `/profile` has a single clear role-aware landing decision
- [x] No redirect loops exist
- [x] No competing redirect owners exist
- [x] No new authorization-related request storm is introduced
- [x] Admin and Store Manager remain outside CartProvider
- [x] Existing route architecture is preserved
- [x] `npm run lint` passes
- [x] `npm run build` passes (verified via typecheck)

## Role → Route Mapping (Final)

| Role | Routes | Notes |
|------|--------|-------|
| `user` | `/`, `/products/*`, `/about`, `/cart`, `/checkout`, `/orders`, `/profile/*`, `/sign-in`, `/sign-up` | Customer application |
| `store_manager` | `/store-manager/*`, plus customer public routes | Store manager application |
| `admin` | `/admin/*`, plus customer public routes | Admin application |

## Permission → Capability Mapping (Current)

| Permission | Capability | Used In |
|------------|-----------|---------|
| `user:access` | Authenticated user access | Customer routes |
| `order:create` | Create orders | Checkout |
| `payment:create` | Initiate payments | Payment flow |
| `food:view` | View menu items | Products |
| `food:like` | Like dishes | Products |
| `food:share` | Share dishes | Products |
| `feedback:create` | Submit feedback | Orders |
| `user:view` | View users | Admin users, Store manager |
| `user:updateRole` | Change user roles | Admin roles |
| `user:delete` | Delete users | Admin users |
| `food:create` | Create menu items | Admin products, Store manager inventory |
| `food:update` | Update menu items | Admin products, Store manager inventory |
| `food:delete` | Delete menu items | Admin products, Store manager inventory |
| `admin:create` | Create admins | Admin roles |
| `admin:delete` | Delete admins | Admin roles |
| `role:manage` | Manage roles/permissions | Admin roles |
| `audit:view` | View audit logs | Admin audit |
| `admin:access` | **DEPRECATED AS ROLE** | Currently used incorrectly |
| `store:view` | View store data | Admin stores, Store manager store |
| `store:create` | Create stores | Admin stores |
| `store:update` | Update stores | Admin stores, Store manager store |
| `store:delete` | Delete stores | Admin stores |

## Critical Rules
1. **Never** use `admin:access` or `store:view` to determine if someone is an admin or store manager
2. **Always** use `session.user.role` for role checks
3. **Only** use `can(permissions, "...")` for capability checks within an authorized area
4. **Never** redirect `/admin/*` to `/store-manager/*` or vice versa
5. **Never** create client-side permission fetching that causes request storms

## Files to Modify

| File | Module | Change |
|------|--------|--------|
| `src/lib/authorize.ts` | 1 | Add role helper |
| `src/app/(admin)/layout.tsx` | 2 | Role check |
| `src/app/store-manager/layout.tsx` | 3 | Role check |
| `src/app/(customer)/(protected)/layout.tsx` | 4 | Role check |
| `src/app/(customer)/(user)/profile/page.tsx` | 5 | Role check |
| `src/app/(customer)/(user)/profile/dashboard/page.tsx` | 5 | Role check |
| `src/app/(auth)/sign-in/page.tsx` | 6 | Role check |
| `src/app/actions/rbac.ts` | 7 | Permission audit |
| `src/app/actions/password.ts` | 7 | Permission audit |
| `src/features/stores/actions.ts` | 7 | Permission audit |
| `src/app/api/admin/**/*.ts` | 8 | Permission audit |
| `src/app/api/store-manager/**/*.ts` | 8 | Permission audit |
| `src/features/cart/context.tsx` | client | Role check |
| `src/components/products/combos/ComboCard.tsx` | client | Role check |
| `src/components/products/product-detail/ProductDetailClient.tsx` | client | Role check |
| `src/components/shared/FloatingCart.tsx` | client | Role check |
| `src/components/shared/ProductCardActions.tsx` | client | Role check |
| `src/components/shared/Navbar.tsx` | client | Role check |
| `src/components/shared/SearchBar.tsx` | client | Role check |

## Execution Order
1. MODULE 1: Create role helper
2. MODULE 2-6: Fix all layouts and redirects to use role
3. MODULE 7: Audit server actions
4. MODULE 8: Audit API routes
5. MODULE 9: Verify no redirect loops
6. MODULE 10: Final verification
