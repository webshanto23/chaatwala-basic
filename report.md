# CHAATWALA — FULL ROUTE & AUTHORIZATION SECURITY AUDIT

**Date**: 2026-08-19
**Scope**: Read-only audit of all routes, layouts, proxy, API endpoints, auth config, and client-side authorization logic.
**Status**: No files modified.

---

## 1. EXECUTIVE SUMMARY

- **P0 CRITICAL**: `/api/cart/item/[id]` allows unauthenticated modification/deletion of any cart item by ID — no auth, no ownership check.
- **P0 CRITICAL**: `/api/user/upload-image` is completely unauthenticated — any anonymous user can upload images.
- **P0 CRITICAL**: `/api/payment/validate` GET handler has no authentication — payment validation can be triggered without a session.
- **P1 HIGH**: Store-manager layout and `/api/store-manager/orders/[orderId]` explicitly allow `admin` role — role boundary is not enforced as specified.
- **P1 HIGH**: `/admin/settings` and `/store-manager/settings` rely solely on layout guards; page-level auth checks do not enforce role, creating inconsistency if routes are ever detached from their layouts.
- **P2 MEDIUM**: Competing redirect owners between `proxy.ts` and `sign-in/page.tsx` create a race condition and redirect chain through `/` for authenticated users visiting `/sign-in`.
- **P2 MEDIUM**: `/change-password` is accessible to all roles (admin, store_manager, user) with no role discrimination.
- **P3 LOW**: `user:access`, `store:view`, `admin:access` permissions are present in all role permission sets, making them ineffective as capability discriminators.
- **P3 LOW**: `/api/cart/route.ts` uses `findFirst` instead of `findUnique` for user cart lookup — potential wrong-cart bug.
- **P4 CLEANUP**: `(user)` route group has no centralized layout; auth checks are duplicated across `/profile` and `/profile/dashboard`. `sitedata.json` has stale admin sidebar links.

---

## 2. COMPLETE ROUTE MATRIX

| Route | Owner | Expected Access | Actual Guard | Status |
|------|-------|----------------|--------------|--------|
| `/` | Root layout + AppShell | ALL | None | ✅ |
| `/sign-in` | (auth)/layout.tsx + sign-in page | Anonymous only | Proxy redirects authenticated → `/` | ✅ |
| `/sign-up` | (auth)/layout.tsx | Anonymous only | None | ⚠️ Auth users can view |
| `/forgot-password` | (auth)/layout.tsx | Anonymous only | None | ⚠️ Auth users can view |
| `/reset-password` | (auth)/layout.tsx | Anonymous + token | None | ⚠️ Auth users can view |
| `/set-password` | (auth)/layout.tsx | Anonymous + token | None | ⚠️ Auth users can view |
| `/verify-email` | (auth)/layout.tsx | Anonymous + token | None | ⚠️ Auth users can view |
| `/change-password` | (auth)/layout.tsx | Authenticated | None | ⚠️ All roles allowed |
| `/access-denied` | Root | ALL authenticated | None | ✅ |
| `/about` | (public)/layout.tsx | ALL | None | ✅ |
| `/license` | (public)/layout.tsx | ALL | None | ✅ |
| `/privacy-policy` | (public)/layout.tsx | ALL | None | ✅ |
| `/terms-and-conditions` | (public)/layout.tsx | ALL | None | ✅ |
| `/products/dishes` | (public)/layout.tsx | ALL | None | ✅ |
| `/products/drinks` | (public)/layout.tsx | ALL | None | ✅ |
| `/products/combos` | (public)/layout.tsx | ALL | None | ✅ |
| `/products/dishes/[id]` | (public)/layout.tsx | ALL | None | ✅ |
| `/products/drinks/[id]` | (public)/layout.tsx | ALL | None | ✅ |
| `/products/combos/[id]` | (public)/layout.tsx | ALL | None | ✅ |
| `/cart` | (protected)/layout.tsx | User only | Layout: auth + role !== admin/store_manager | ✅ |
| `/checkout` | (protected)/layout.tsx | User only | Layout: auth + role !== admin/store_manager | ✅ |
| `/orders` | (protected)/layout.tsx | User only | Layout: auth + role !== admin/store_manager | ✅ |
| `/profile` | (user)/page.tsx inline | User only | Inline: auth + role !== admin/store_manager | ✅ |
| `/profile/dashboard` | (user)/page.tsx inline | User only | Inline: auth + role !== admin/store_manager | ✅ |
| `/admin/dashboard` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/users` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/roles` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/stores` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/products/dishes` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/products/drinks` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/products/combos` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/orders` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/audit` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/admin/settings` | (admin)/layout.tsx | Admin only | Layout: auth + role === admin | ✅ |
| `/store-manager/dashboard` | store-manager/layout.tsx | Store manager only | Layout: auth + role in [admin, store_manager] + managedStore | ⚠️ Admin allowed |
| `/store-manager/store` | store-manager/layout.tsx | Store manager only | Layout: auth + role in [admin, store_manager] + managedStore | ⚠️ Admin allowed |
| `/store-manager/orders` | store-manager/layout.tsx | Store manager only | Layout: auth + role in [admin, store_manager] + managedStore | ⚠️ Admin allowed |
| `/store-manager/inventory` | store-manager/layout.tsx | Store manager only | Layout: auth + role in [admin, store_manager] + managedStore | ⚠️ Admin allowed |
| `/store-manager/settings` | store-manager/layout.tsx | Store manager only | Layout: auth + role in [admin, store_manager] + managedStore | ⚠️ Admin allowed |
| `/checkout/success` | None (standalone) | ALL | None | ✅ |
| `/checkout/fail` | None (standalone) | ALL | None | ✅ |
| `/checkout/cancel` | None (standalone) | ALL | None | ✅ |

---

## 3. COMPLETE API MATRIX

| API | Anonymous | User | Store Manager | Admin | Actual Guard | Status |
|-----|-----------|------|---------------|-------|--------------|--------|
| `/api/auth/[...nextauth]` | ALLOW | ALLOW | ALLOW | ALLOW | None (NextAuth) | ✅ |
| `/api/stores` | ALLOW | ALLOW | ALLOW | ALLOW | None | ✅ |
| `/api/search/popular` | ALLOW | ALLOW | ALLOW | ALLOW | None | ✅ |
| `/api/search` | ALLOW | ALLOW | ALLOW | ALLOW | None | ✅ |
| `/api/cart` (GET) | ALLOW (guest) | ALLOW | ALLOW | ALLOW | `auth()` + guest cookie | ✅ |
| `/api/cart` (POST) | ALLOW (guest) | ALLOW | ALLOW | ALLOW | `auth()` + guest cookie + rate limit | ✅ |
| `/api/cart` (DELETE) | ALLOW (guest) | ALLOW | ALLOW | ALLOW | `auth()` + rate limit | ✅ |
| `/api/cart/item/[id]` (PATCH) | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **NONE** | 🔴 P0 |
| `/api/cart/item/[id]` (DELETE) | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **NONE** | 🔴 P0 |
| `/api/cart/validate-store` | ALLOW (guest) | ALLOW | ALLOW | ALLOW | `auth()` + guest cookie | ✅ |
| `/api/orders` (POST) | DENY | ALLOW | DENY | DENY | `auth()` + rate limit | ✅ |
| `/api/my-orders` (GET) | DENY | ALLOW | DENY | DENY | `auth()` + userId check | ✅ |
| `/api/payment/initiate` (POST) | ALLOW (guest) | ALLOW | ALLOW | ALLOW | `auth()` + guest cookie + rate limit | ✅ |
| `/api/payment/validate` (POST) | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **Rate limit only** | 🟡 P0 |
| `/api/payment/validate` (GET) | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **NONE** | 🔴 P0 |
| `/api/admin/users` (GET) | DENY | DENY | DENY | ALLOW | `requireRole("admin")` + `user:view` | ✅ |
| `/api/admin/users` (POST) | DENY | DENY | DENY | ALLOW | `requireRole("admin")` + `user:access` | ✅ |
| `/api/admin/orders/[orderId]` (GET) | DENY | DENY | DENY | ALLOW | `requireRole("admin")` + `order:view` | ✅ |
| `/api/admin/users/[userId]` (GET) | DENY | DENY | DENY | ALLOW | `requireRole("admin")` + `user:view` | ✅ |
| `/api/admin/export` (GET) | DENY | DENY | DENY | ALLOW | `requireRole("admin")` | ✅ |
| `/api/store-manager/orders/[orderId]` (GET) | DENY | DENY | **ALLOW** | **ALLOW** | `requireRole(["admin","store_manager"])` + `order:view` + store check | ⚠️ P1 |
| `/api/user/address` (GET) | DENY | ALLOW | DENY | ALLOW* | `auth()` + userId | ✅ |
| `/api/user/address` (POST) | DENY | ALLOW | DENY | ALLOW* | `auth()` + userId | ✅ |
| `/api/user/address/[id]` (PUT) | DENY | ALLOW | DENY | ALLOW* | `auth()` + ownership check | ✅ |
| `/api/user/address/[id]` (DELETE) | DENY | ALLOW | DENY | ALLOW* | `auth()` + ownership check | ✅ |
| `/api/user/profile` (GET) | DENY | ALLOW | DENY | ALLOW* | `auth()` + userId | ✅ |
| `/api/user/profile` (PATCH) | DENY | ALLOW | DENY | ALLOW* | `auth()` + userId | ✅ |
| `/api/user/me` (GET) | DENY | ALLOW | DENY | ALLOW* | `auth()` + userId | ✅ |
| `/api/user/upload-image` (POST) | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **NONE** | 🔴 P0 |
| `/api/password/forgot-password` (POST) | ALLOW | ALLOW | ALLOW | ALLOW | None (server action) | ✅ |
| `/api/password/reset-password` (POST) | ALLOW | ALLOW | ALLOW | ALLOW | None (server action) | ✅ |
| `/api/password/set-password` (POST) | ALLOW | ALLOW | ALLOW | ALLOW | None (server action) | ✅ |
| `/api/password/verify-email` (POST) | ALLOW | ALLOW | ALLOW | ALLOW | None (server action) | ✅ |
| `/api/password/change-password` (POST) | DENY** | ALLOW | ALLOW | ALLOW | None (server action) | ⚠️ P2 |
| `/api/password/send-verification` (POST) | ALLOW | ALLOW | ALLOW | ALLOW | None (server action) | ✅ |

\* Admin access to user APIs is not explicitly blocked but admin users have their own data; cross-user access would require manipulating `userId` which is derived from session, so it's implicitly blocked.
\** The `change-password` API route has no auth check at all — any anonymous user can call it. The page is client-side only and relies on the session, but the API route itself is open.

---

## 4. ROLE BOUNDARY FINDINGS

### ADMIN
- **Can access**: All admin routes, admin APIs, user APIs (implicitly, via own userId), public routes
- **Cannot access**: Customer protected routes (blocked by layout), store-manager routes (allowed — see P1)
- **Findings**: 
  - Admin can access `/store-manager/*` routes and APIs (P1)
  - Admin can access `/change-password` page (P2)

### STORE_MANAGER
- **Can access**: Store-manager routes (with managedStore), public routes
- **Cannot access**: Admin routes (blocked by layout), customer protected routes (blocked by layout)
- **Findings**:
  - Store manager can access `/change-password` page (P2)
  - Store manager can access `/sign-up`, `/forgot-password`, etc. (low risk)

### USER
- **Can access**: Customer protected routes, public routes, `/profile/*`
- **Cannot access**: Admin routes (blocked by layout), store-manager routes (blocked by layout)
- **Findings**:
  - User can access `/change-password` page (P2 — may be intentional)
  - User can access `/sign-up`, `/forgot-password`, etc. (low risk)

### ANONYMOUS
- **Can access**: Public routes, auth routes, `/api/stores`, `/api/search/*`, `/api/cart` (guest), `/api/payment/initiate` (guest), password APIs
- **Cannot access**: Protected routes (blocked by layouts), protected APIs (blocked by auth checks)
- **Findings**:
  - Anonymous can call `/api/cart/item/[id]` PATCH/DELETE (P0)
  - Anonymous can call `/api/user/upload-image` (P0)
  - Anonymous can call `/api/payment/validate` GET (P0)
  - Anonymous can call `/api/password/change-password` (P2)

---

## 5. PERMISSION FINDINGS

### Permission-to-Role Inference (BAD pattern search)
- **`admin:access`** — Present in `ADMIN_PERMISSIONS` only. Used nowhere in codebase as a permission check. Acts as a hidden role identifier. **Finding**: Unused permission that semantically identifies the admin role.
- **`store:view`** — Present in both `ADMIN_PERMISSIONS` and `STORE_MANAGER_PERMISSIONS`. Used in admin store management and store-manager dashboard. **Finding**: Cross-role permission makes it impossible to distinguish admin from store_manager by permissions alone.
- **`user:access`** — Present in all three roles. Used in `/api/admin/users` POST. **Finding**: Useless as a discriminator since every role has it.

### Unused Permissions
- `admin:create`, `admin:delete` — Defined in `ADMIN_PERMISSIONS` but never checked in any route or server action.
- `food:like`, `food:share`, `feedback:create` — Defined in `USER_PERMISSIONS` but never checked.
- `role:manage` — Defined in `ADMIN_PERMISSIONS` but never checked; role assignment is done via direct Prisma calls in admin pages.

### Missing Permissions
- No `order:create` permission check in `/api/orders` POST — relies on session presence only.
- No `store:view` permission check in store-manager layout — relies on role + managedStore existence.
- No `payment:create` permission check in `/api/payment/initiate` — relies on session presence only.

### Deprecated Patterns
- `canAny(permissions, ["*"])` wildcard check exists but no role is assigned `"*"` — dead code path.
- `createCan` utility is exported but unused outside tests.

---

## 6. REDIRECT MAP

| Source | Condition | Destination | Owner | Type |
|--------|-----------|-------------|-------|------|
| `/sign-in` | Authenticated | `/` | `proxy.ts:12-20` | Server redirect |
| `/sign-in` | Authenticated | `/admin/dashboard` or `/store-manager/dashboard` or `/profile/dashboard` | `sign-in/page.tsx:34-48` | Client redirect |
| `/admin` | Any | `/admin/dashboard` | `proxy.ts:23-25` | Server redirect |
| `/store-manager` | Any | `/store-manager/dashboard` | `proxy.ts:27-29` | Server redirect |
| `/cart` | Not authenticated | `/sign-in?redirect=/cart` | `(protected)/layout.tsx:7-8` | Server redirect |
| `/checkout` | Not authenticated | `/sign-in` | `(protected)/layout.tsx:7-8` | Server redirect |
| `/orders` | Not authenticated | `/sign-in` | `(protected)/layout.tsx:7-8` | Server redirect |
| `/cart` | Not authenticated | `/sign-in?redirect=/cart` | `cart/page.tsx:124-126` | Client redirect |
| `/admin/*` | Not authenticated | `/sign-in` | `(admin)/layout.tsx:8-9` | Server redirect |
| `/admin/*` | Non-admin | `/access-denied` | `(admin)/layout.tsx:13-14` | Server redirect |
| `/store-manager/*` | Not authenticated | `/sign-in` | `store-manager/layout.tsx:9-10` | Server redirect |
| `/store-manager/*` | No managedStore | `/access-denied` | `store-manager/layout.tsx:23-24` | Server redirect |
| `/store-manager/*` | Non-admin/non-store_manager | `/access-denied` | `store-manager/layout.tsx:14-15` | Server redirect |
| `/profile` | Admin or store_manager | `/access-denied` | `(user)/profile/page.tsx:13-14` | Server redirect |
| `/profile/dashboard` | Admin or store_manager | `/access-denied` | `(user)/profile/dashboard/page.tsx:14-15` | Server redirect |
| `/admin/settings` | Not authenticated | `/sign-in` | `admin/settings/page.tsx:10-11` | Server redirect |
| `/store-manager/settings` | Not authenticated | `/sign-in` | `store-manager/settings/page.tsx:10-11` | Server redirect |
| `/sign-in` (logout) | Authenticated | `/` | `Navbar.tsx:188-189` | Client redirect |

---

## 7. REDIRECT LOOP FINDINGS

### LOOP-1: Authenticated user visits `/sign-in`
**Chain**: `/sign-in` → (proxy) → `/` → (client useEffect hydrates) → `/admin/dashboard` or `/store-manager/dashboard`

**Evidence**:
- `proxy.ts:17-19`: Server redirects authenticated `/sign-in` → `/`
- `sign-in/page.tsx:34-48`: Client `useEffect` fires after hydration, redirects to role-specific dashboard
- Result: Two redirects for one action. Not an infinite loop, but an unnecessary bounce through `/`.

### LOOP-2: Admin visits `/store-manager/dashboard`
**Chain**: `/store-manager/dashboard` → (store-manager layout) → ALLOW (admin is permitted) → admin sees store-manager UI

**Evidence**: `store-manager/layout.tsx:14` explicitly allows admin. No redirect occurs, but this violates the intended role boundary.

### LOOP-3: User visits `/profile`
**Chain**: `/profile` → (inline check) → `/profile/dashboard` → (inline check) → `/access-denied` → (user clicks "Go to Home") → `/`

**Evidence**: Admin or store_manager visiting `/profile` gets redirected to `/access-denied`, which only links to `/`. They cannot reach their actual dashboard from `/access-denied`.

### NO INFINITE LOOPS FOUND
No circular redirect chains were identified. All redirects terminate at a renderable page.

---

## 8. SECURITY VULNERABILITIES

### P0 — CRITICAL

**VULN-1: Unauthenticated cart item mutation**
- **File**: `src/app/api/cart/item/[id]/route.ts`
- **Lines**: 22-52 (PATCH), 54-101 (DELETE)
- **Problem**: No `auth()`, no session check, no cart ownership verification. Any anonymous user who knows or guesses a cart item ID can modify quantity or delete it.
- **Attack**: `DELETE /api/cart/item/abc123` deletes cart item without authentication.
- **Fix**: Add `auth()` check + verify `item.cartId` belongs to session user or guest cookie.

**VULN-2: Unauthenticated image upload**
- **File**: `src/app/api/user/upload-image/route.ts`
- **Lines**: 4-23
- **Problem**: No authentication. Any anonymous user can POST images to ImageBB provider.
- **Attack**: Abuse upload quota, store malicious content, fill storage.
- **Fix**: Add `auth()` check + rate limiting.

**VULN-3: Unauthenticated payment validation (GET)**
- **File**: `src/app/api/payment/validate/route.ts`
- **Lines**: 85-153
- **Problem**: GET handler has zero authentication. Can trigger order status updates and tag invalidations.
- **Attack**: Repeated GET requests with guessed `val_id` parameters could spam `revalidateTag` calls.
- **Fix**: Add `auth()` or at minimum restrict to POST-only with CSRF protection.

### P1 — HIGH

**VULN-4: Admin role allowed in store-manager area**
- **File**: `src/app/store-manager/layout.tsx`
- **Line**: 14
- **Problem**: `if (role !== "admin" && role !== "store_manager")` explicitly permits admin.
- **Impact**: Admins can view and interact with store-manager UI, which is outside the intended admin boundary.
- **Fix**: Remove `"admin"` from the allowed roles check unless there is explicit business documentation.

**VULN-5: Admin allowed in store-manager API**
- **File**: `src/app/api/store-manager/orders/[orderId]/route.ts`
- **Line**: 8
- **Problem**: `requireRole(["admin", "store_manager"])` allows admin API access.
- **Fix**: Restrict to `requireRole("store_manager")` unless business requirement exists.

**VULN-6: Settings pages rely solely on layout guard**
- **Files**: `src/app/(admin)/admin/settings/page.tsx`, `src/app/store-manager/settings/page.tsx`
- **Problem**: Page-level auth checks only verify session existence, not role. If these pages are ever moved outside their guarded layouts, they become accessible to any authenticated user.
- **Fix**: Add explicit `requireRole` checks at page level as defense-in-depth.

### P2 — MEDIUM

**VULN-7: Competing redirect owners on `/sign-in`**
- **Files**: `src/proxy.ts:12-20`, `src/app/(auth)/sign-in/page.tsx:34-48`
- **Problem**: Proxy (server) redirects authenticated `/sign-in` → `/`. Client useEffect then redirects → role dashboard. Two redirects, unnecessary bounce.
- **Fix**: Remove client-side redirect from sign-in page; let proxy handle it, or remove proxy redirect and let client handle it. Not both.

**VULN-8: `/change-password` accessible to all roles**
- **File**: `src/app/(auth)/change-password/page.tsx`
- **Problem**: No role check. Admin and store_manager can access user password change form.
- **Fix**: Add role guard or move to appropriate route group.

**VULN-9: `/api/password/change-password` has no auth**
- **File**: `src/app/api/password/change-password/route.ts`
- **Problem**: API route accepts POST from anyone. Server action may enforce auth internally, but the API route itself does not.
- **Fix**: Add `auth()` check to API route.

### P3 — LOW

**VULN-10: Permissions used as hidden role identifiers**
- **Files**: `src/lib/permissions.ts`
- **Problem**: `admin:access`, `store:view`, `user:access` exist in multiple roles. `admin:access` is only in `ADMIN_PERMISSIONS` but is never checked — it exists solely as a role marker.
- **Fix**: Remove unused role-identifying permissions or document them as such.

**VULN-11: `findFirst` used for user cart lookup**
- **File**: `src/app/api/cart/route.ts`
- **Line**: 28
- **Problem**: `prisma.cart.findFirst({ where: { userId } })` could return wrong cart if data corruption creates duplicates. Should use `findUnique` (requires unique constraint on `userId`).
- **Fix**: Add unique constraint on `Cart.userId` in Prisma schema and use `findUnique`.

### P4 — CLEANUP

**VULN-12: Missing `(user)` layout**
- **File**: `src/app/(customer)/(user)/layout.tsx` does not exist
- **Problem**: No centralized auth guard for user routes. `/profile` and `/profile/dashboard` duplicate inline checks.
- **Fix**: Create `(user)/layout.tsx` with same pattern as `(protected)/layout.tsx`.

**VULN-13: Stale `sitedata.json` navigation links**
- **File**: `sitedata.json`
- **Problem**: `adminSidebarLinks` contains `/admin` (redirects to `/admin/dashboard`), missing `/admin/settings`, `/admin/audit`, `/admin/roles`, `/admin/stores`, `/admin/products/combos`.
- **Fix**: Update navigation data to match actual routes.

**VULN-14: Duplicate payment validation logic**
- **File**: `src/app/api/payment/validate/route.ts`
- **Lines**: 7-83 (POST) and 85-153 (GET)
- **Problem**: Nearly identical code duplicated for POST and GET handlers.
- **Fix**: Extract shared validation logic into a helper function.

---

## 9. FILES RESPONSIBLE

| File | Lines | Problem |
|------|-------|---------|
| `src/app/api/cart/item/[id]/route.ts` | 22-101 | P0: No auth/ownership on PATCH/DELETE |
| `src/app/api/user/upload-image/route.ts` | 4-23 | P0: No authentication |
| `src/app/api/payment/validate/route.ts` | 85-153 | P0: No auth on GET |
| `src/app/store-manager/layout.tsx` | 14 | P1: Admin allowed |
| `src/app/api/store-manager/orders/[orderId]/route.ts` | 8 | P1: Admin allowed in API |
| `src/app/(admin)/admin/settings/page.tsx` | 7-11 | P1: No role check (defense-in-depth) |
| `src/app/store-manager/settings/page.tsx` | 7-11 | P1: No role check (defense-in-depth) |
| `src/proxy.ts` | 12-20 | P2: Competing redirect with sign-in page |
| `src/app/(auth)/sign-in/page.tsx` | 34-48 | P2: Competing redirect with proxy |
| `src/app/(auth)/change-password/page.tsx` | 1-138 | P2: No role guard |
| `src/app/api/password/change-password/route.ts` | 4-16 | P2: No auth on API |
| `src/lib/permissions.ts` | 8-51 | P3: Role-identifying permissions |
| `src/app/api/cart/route.ts` | 28 | P3: findFirst instead of findUnique |
| `src/app/(customer)/(user)/layout.tsx` | N/A | P4: Missing file |
| `sitedata.json` | 503-524 | P4: Stale admin sidebar links |
| `src/app/api/payment/validate/route.ts` | 85-153 | P4: Duplicate logic |

---

## 10. RECOMMENDED FIX ORDER

| Priority | Count | Actions |
|----------|-------|---------|
| **P0** | 3 | Add auth to `/api/cart/item/[id]`, `/api/user/upload-image`, `/api/payment/validate` GET |
| **P1** | 3 | Remove admin from store-manager layout/API; add defense-in-depth role checks to settings pages |
| **P2** | 3 | Resolve sign-in redirect competition; add role guard to change-password; add auth to change-password API |
| **P3** | 2 | Clean up permission semantics; fix cart findFirst |
| **P4** | 3 | Create `(user)/layout.tsx`; update `sitedata.json`; deduplicate payment validation |

---

## 11. FILES CHANGED

**NONE**

This is an audit-only deliverable. No code was modified.
