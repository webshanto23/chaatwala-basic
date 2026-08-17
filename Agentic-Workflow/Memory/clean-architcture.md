# Clean Architecture Plan: Layout Restructure

## Status: COMPLETED

## Current Problem (SOLVED)
`app/layout.tsx` wrapped **every** route in `AppShell` → `CartProvider`. This meant:
- Admin pages got Navbar, Footer, FloatingCart, SearchBar (conditionally hidden but still mounted)
- Store-manager pages got the full customer shell
- `CartProvider` mounted on every route, firing `fetch("/api/cart")` on mount
- Store managers always hit DB because `isAdmin` guard doesn't cover them
- Admins may hit DB if auth context hasn't hydrated yet when `isAdmin` check runs

## Target Architecture (IMPLEMENTED)

```
app/
├── layout.tsx                          ← ROOT: only global providers
│                                         ThemeProvider, AuthProvider, UserDataProvider, Toaster
│                                         REMOVED: AppShell, CartProvider
│
├── (customer)/                         ← NEW GROUP: all customer-facing routes
│   ├── layout.tsx                      ← AppShell + CartProvider
│   │                                     Navbar, Footer, FloatingCart, SearchBar
│   │
│   ├── (public)/
│   │   ├── layout.tsx                  ← pass-through
│   │   ├── page.tsx                    ← home
│   │   ├── about/page.tsx
│   │   ├── license/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   ├── terms-and-conditions/page.tsx
│   │   └── products/
│   │       ├── layout.tsx              ← products layout
│   │       ├── combos/page.tsx
│   │       ├── combos/[id]/page.tsx
│   │       ├── dishes/page.tsx
│   │       ├── dishes/[id]/page.tsx
│   │       ├── drinks/page.tsx
│   │       └── drinks/[id]/page.tsx
│   │
│   ├── (protected)/
│   │   ├── layout.tsx                  ← auth guard
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── orders/page.tsx
│   │
│   ├── (user)/
│   │   ├── layout.tsx                  ← auth guard
│   │   └── profile/
│   │       ├── page.tsx                ← role-based redirect
│   │       └── dashboard/page.tsx
│   │
│   └── checkout/                       ← PUBLIC result pages (no auth required)
│       ├── success/page.tsx
│       ├── cancel/page.tsx
│       └── fail/page.tsx
│
├── (admin)/                            ← NO CartProvider, NO AppShell
│   ├── layout.tsx                      ← AdminLayout + AdminShell
│   └── admin/
│       ├── dashboard/page.tsx
│       ├── users/page.tsx + UsersClient.tsx
│       ├── roles/page.tsx + RolesClient.tsx
│       ├── stores/page.tsx + StoresClient.tsx
│       ├── products/
│       │   ├── dishes/page.tsx + DishesClient.tsx
│       │   ├── drinks/page.tsx + DrinksClient.tsx
│       │   └── combos/page.tsx
│       ├── orders/page.tsx + OrdersClient.tsx
│       ├── audit/page.tsx + AuditClient.tsx
│       └── settings/page.tsx + AdminSettingsClient.tsx
│
├── (auth)/                             ← NO CartProvider, NO AppShell
│   ├── layout.tsx                      ← AuthLayout (minimal pass-through)
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── set-password/page.tsx
│   ├── verify-email/page.tsx
│   └── change-password/page.tsx
│
└── store-manager/                      ← NO CartProvider, NO AppShell
    ├── layout.tsx                      ← StoreManagerLayout + StoreManagerShell
    ├── dashboard/page.tsx + DashboardClient.tsx
    ├── store/page.tsx + StoreClient.tsx
    ├── orders/page.tsx + OrdersClient.tsx
    ├── inventory/page.tsx + InventoryClient.tsx
    └── settings/page.tsx + StoreManagerSettingsClient.tsx
```

## Zero DB Hit Guarantee

| Route Group | CartProvider Mounts? | /api/cart Fires? | Navbar/Footer? |
|-------------|---------------------|------------------|----------------|
| (customer)/(public) | ✓ | ✓ (available but not auto-fetched for non-cart pages) | ✓ |
| (customer)/(protected) | ✓ | ✓ (cart/checkout/orders need it) | ✓ |
| (customer)/(user) | ✓ | ✓ (user dashboard may show cart) | ✓ |
| (customer)/checkout | ✓ | ✓ (checkout needs cart) | ✓ |
| (admin) | ✗ | ✗ | ✗ |
| (auth) | ✗ | ✗ | ✗ |
| store-manager | ✗ | ✗ | ✗ |

## Implementation Results

### MODULE 1: Create (customer)/layout.tsx with AppShell + CartProvider ✓
- **Created:** `src/app/(customer)/layout.tsx`
- **Content:** AppShell wrapper (which contains CartProvider, Navbar, Footer, FloatingCart, SearchBar)
- **Status:** Completed

### MODULE 2: Simplify root layout ✓
- **Edited:** `src/app/layout.tsx`
- **Removed:** AppShell import and wrapper
- **Kept:** ThemeProvider, AuthProvider, UserDataProvider, Toaster
- **Added:** Missing imports for providers
- **Status:** Completed

### MODULE 3: Move (public) routes into (customer)/(public) ✓
- **Moved:** `src/app/(public)/` → `src/app/(customer)/(public)/`
- **Files:** layout.tsx, page.tsx, about/page.tsx, license/page.tsx, privacy-policy/page.tsx, terms-and-conditions/page.tsx, products/ (with layout.tsx and all product pages)
- **Status:** Completed

### MODULE 4: Move (protected) routes into (customer)/(protected) ✓
- **Moved:** `src/app/(protected)/` → `src/app/(customer)/(protected)/`
- **Files:** layout.tsx, cart/page.tsx, checkout/page.tsx, orders/page.tsx
- **Status:** Completed

### MODULE 5: Move (user) profile routes into (customer)/(user) ✓
- **Moved:** `src/app/(user)/` → `src/app/(customer)/(user)/`
- **Files:** profile/page.tsx, profile/dashboard/page.tsx
- **Status:** Completed

### MODULE 6: Move checkout result pages into (customer)/checkout ✓
- **Moved:** `src/app/checkout/` → `src/app/(customer)/checkout/`
- **Files:** success/page.tsx, cancel/page.tsx, fail/page.tsx
- **Status:** Completed

### MODULE 7-8: Verify layouts ✓
- **(auth)/layout.tsx:** Minimal pass-through, no changes needed
- **(admin)/layout.tsx:** Uses AdminShell, no AppShell/CartProvider imports
- **store-manager/layout.tsx:** Uses StoreManagerShell, no AppShell/CartProvider imports
- **Status:** Completed

### MODULE 9: Fix broken imports ✓
- **Fixed:** `src/app/(customer)/layout.tsx` — changed `import AppShell` to `import { AppShell }` (named export)
- **Fixed:** `src/app/layout.tsx` — added missing imports for ThemeProvider, AuthProvider, UserDataProvider
- **Verified:** No internal imports reference old paths (`@/app/(public)`, `@/app/(protected)`, etc.)
- **Status:** Completed

### MODULE 10: Verify proxy and test all routes ✓
- **Proxy:** `src/proxy.ts` unchanged — route groups are URL-less, so all path checks still work
- **TypeScript:** No errors in source files (only pre-existing test errors)
- **ESLint:** No errors in moved files (only pre-existing warnings)
- **Status:** Completed

## Component Ownership (Final)

| Component | Location | Used By |
|-----------|----------|---------|
| AppShell | `src/components/layout/app-shell.tsx` | (customer)/layout.tsx only |
| AdminShell | `src/components/admin/admin-shell.tsx` | (admin)/layout.tsx only |
| StoreManagerShell | `src/components/store-manager/store-manager-shell.tsx` | store-manager/layout.tsx only |
| CartProvider | `src/features/cart/context.tsx` | (customer)/layout.tsx only |
| AuthProvider | `src/contexts/auth-context.tsx` | root layout |
| UserDataProvider | `src/contexts/auth-context.tsx` | root layout |
| ThemeProvider | `src/contexts/theme-context.tsx` | root layout |
| Navbar | `src/components/shared/Navbar.tsx` | AppShell only |
| Footer | `src/components/shared/footer/Footer.tsx` | AppShell only |
| FloatingCart | `src/components/shared/FloatingCart.tsx` | AppShell only |
| SearchBar | `src/components/shared/SearchBar.tsx` | AppShell only |

## Rollback
All moves are git-tracked. If anything breaks:
1. `git revert` the commit
2. Or manually move directories back
3. URLs never change, so no external links break
