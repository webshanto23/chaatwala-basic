# Chaatwala Hydration, Auth, Redirect, and Refresh Audit

Audit date: 2026-08-20  
Method: static review of the current route tree, layouts, NextAuth configuration, providers, cart/checkout flows, and relevant route handlers. Historical workflow notes were used only as leads and checked against current source. No runtime browser trace was performed, so findings that require NextAuth timing confirmation are marked accordingly.

## Remediation status

Implemented on 2026-08-20:

- **H-02/H-03:** Credentials login now routes to a validated internal return path or the authenticated role’s landing page; OAuth keeps the same safe return-path policy.
- **H-07:** Cart validation, payment initiation, and the order endpoint now share inventory-aware availability logic that supports global products and `StoreInventory` overrides.
- **H-01/H-04:** Customer routes now use the root’s server-seeded theme/auth providers. User data is customer-scoped, and user/cart state remounts for each session identity so it cannot carry across logout or user changes.
- **H-05:** Reopened: enforcing verification at credential sign-in locks out existing and seeded accounts with `emailVerified = null`. Verification requires a migration/rollout policy plus an unauthenticated resend path before it can safely become a login gate.
- **H-06/R-03:** Store selection is user-scoped, clears persistently, and both checkout views display retryable store/availability failures while blocking payment until validation completes.
- **H-08:** Payment initiation accepts a selected saved-address ID, verifies it belongs to the signed-in user, and persists it on the order.
- **Payment callback:** Checkout success now consumes SSLCommerz `val_id`, submits form-encoded data to the validation route, and displays a bounded error when the gateway callback lacks a validation ID.

The remaining findings are not addressed by this P0 change.

## Executive summary

There is no source-confirmed **infinite redirect loop** in the current role layouts: admin, store-manager, and customer guards terminate wrong-role access at `/access-denied`. The observed auth and refresh failures instead have concrete causes:

1. Customer pages shadow the root server-seeded auth provider with a second provider that must fetch the session in the browser.
2. Credentials sign-in succeeds without navigating or refreshing the route, and discards the requested return URL.
3. Cart and user-data contexts do not reset or reload when the authenticated identity changes within the customer shell.
4. Current store validation conflicts with the global-product/per-store-inventory data model, preventing checkout for global products.

## Confirmed defects

### H-01 — Customer routes mount a second, unseeded auth stack

- **Severity:** High
- **Files:** `src/app/layout.tsx`, `src/components/layout/app-shell.tsx:59-67`, `src/contexts/auth-context.tsx:30-46`
- **Evidence:** Root layout passes `await auth()` to `AuthProvider(initialSession={session})`. `AppShell` then wraps customer content in another `ThemeProvider`, `AuthProvider` without `initialSession`, and `UserDataProvider`. React consumers use the nearest provider.
- **Root cause:** The customer Navbar, cart, and checkout read a `SessionProvider` that has no server session. Its first reliable authenticated state requires client session resolution.
- **User impact:** Authenticated customer pages can render anonymous controls first (notably “Sign In”), then switch after hydration/session fetch. It also duplicates theme and user-data state.
- **Classification:** Confirmed provider ownership defect; the exact browser console hydration warning still requires runtime reproduction. The visible auth-state flash is high-confidence.
- **Recommended direction:** Keep global providers single-owned at root or make customer-only providers explicit without re-wrapping global auth/theme/user data. Preserve `CartProvider` only in the customer shell.

### H-02 — Successful credentials sign-in leaves the user on `/sign-in`

- **Severity:** High
- **File:** `src/app/(auth)/sign-in/page.tsx:38-57`
- **Evidence:** Credentials login calls `signIn("credentials", { redirect: false })`. On success the handler only calls `setIsLoading(false)`; it neither reads the returned URL nor calls `router.replace`, `router.refresh`, or another post-login route transition.
- **Root cause:** The form chooses manual navigation (`redirect: false`) but does not implement the required success navigation.
- **User impact:** A successful credentials login can appear to do nothing until the user manually navigates or refreshes. That later request lets the proxy/layout observe the new cookie, making the issue look intermittent.
- **Recommended direction:** Select one post-login navigation owner and explicitly navigate on success using the validated callback URL or a role-aware default.

### H-03 — Requested return URL is erased and never honored

- **Severity:** High
- **Files:** `src/app/(customer)/(protected)/cart/page.tsx:123-126`, `src/app/(auth)/sign-in/page.tsx:23-57`
- **Evidence:** Cart sends unauthenticated users to `/sign-in?redirect=/cart`. Sign-in immediately runs `router.replace("/sign-in")`, removing all query parameters, and never reads `redirect` afterward.
- **Root cause:** The callback/return URL is neither preserved nor validated nor used after successful authentication.
- **User impact:** Users lose their intended destination after login; checkout/cart continuation is broken.
- **Recommended direction:** Define one safe internal callback parameter, retain it through sign-in, validate it as a local path, and consume it on successful login before falling back to the role landing page.

### H-04 — Customer context can display prior-session cart/profile data

- **Severity:** High
- **Files:** `src/contexts/auth-context.tsx:105-143`, `src/features/cart/context.tsx:25-80`, `src/components/shared/Navbar.tsx`
- **Evidence:** `UserDataProvider` contains no effect keyed to session/user identity; it retains `profile` and `addresses` until a page manually invokes `refresh()`. `CartProvider` refreshes only when its `refresh` callback changes, and that callback depends only on `isAdmin`, not user ID or authentication state. Navbar logout performs `signOut()` then client navigation within the customer shell.
- **Root cause:** Context ownership is not coupled to session identity. A logout, session expiry, or user switch that preserves the customer layout does not clear or refetch context state.
- **User impact:** Cart counts, cart items, profile data, or addresses can be stale after logout/session change and can briefly expose the previous user’s UI state to the next session in the same tab.
- **Recommended direction:** Make user data and cart initialization explicitly react to session status and user ID: clear on anonymous/changed identity; fetch only after a stable authenticated or guest identity is known; show a bounded loading state while the transition completes.

### H-05 — Email verification is not enforced by credentials authentication

- **Severity:** High
- **Files:** `src/app/actions/auth.ts`, `src/lib/auth.ts:88-104`
- **Evidence:** Registration creates `emailVerified = null` and tells users to verify. The credentials `authorize` callback checks only that the user/password exists and that bcrypt matches; it never checks `user.emailVerified`.
- **Root cause:** The registration/verification UX promises an access requirement that the authentication gate does not implement.
- **User impact:** Unverified credentials users can sign in and access protected customer routes.
- **Recommended direction:** Decide whether verification is required. If it is, enforce it server-side in the credentials authorization path and give the sign-in page a specific verification-required outcome.

### H-06 — Global store selection leaks across users and cannot be cleared persistently

- **Severity:** Medium
- **Files:** `src/app/(customer)/(protected)/cart/page.tsx:55-75, 112-120`; `src/app/(customer)/(protected)/checkout/page.tsx:62-84, 123-129`
- **Evidence:** Both pages use a browser-global `localStorage["selectedStoreId"]`, with no user namespace or logout cleanup. When the select value is cleared, state is set to `null` but the key is not removed; the prior store is restored on the next refresh if it still exists.
- **Root cause:** Selection persistence is not scoped to a customer identity and has no clear/remove operation.
- **User impact:** A second account in the same browser inherits the prior account’s store selection; a user cannot reliably clear a selected store before refresh.
- **Recommended direction:** Scope selection to the authenticated user (or deliberately make it guest-scoped), remove it when cleared/logout occurs, and centralize the ownership instead of duplicating it in cart and checkout pages.

### H-07 — Store availability validation contradicts the current inventory model

- **Severity:** High
- **Files:** `prisma/schema.prisma` (`StoreInventory` and nullable product `storeId`), `src/app/api/cart/validate-store/route.ts:50-69`, `src/app/api/payment/initiate/route.ts`
- **Evidence:** The schema supports global products (`Dish`/`Drink`/`Combo.storeId = null`) and per-store availability through `StoreInventory`. Validation instead queries each product table with `storeId: selectedStoreId`; payment initiation repeats this predicate. Global products do not equal a real selected store ID.
- **Root cause:** Checkout availability uses the older product-to-store relation rather than `StoreInventory`.
- **User impact:** Global catalog items can be reported as unavailable at every selected store, disabling checkout client-side and rejecting payment server-side.
- **Recommended direction:** Use one shared availability service that applies global product availability plus the selected store’s `StoreInventory` override, and call it from both validation and payment/order creation.

### H-08 — Payment orders do not retain the selected address relation

- **Severity:** Medium
- **Files:** `src/app/(customer)/(protected)/cart/page.tsx`, `src/app/(customer)/(protected)/checkout/page.tsx`, `src/app/api/payment/initiate/route.ts:217-240`
- **Evidence:** UI sends a `shippingAddress` object. Payment initiation creates `Order` with `userId` and `storeId`, but not `addressId`, even though `Order` has an address relation. The address object is only used to populate gateway fields.
- **Root cause:** The API contract transports address details but not the persisted address ID, and the creation mutation does not set `addressId`.
- **User impact:** Completed/pending orders cannot reliably show, audit, or enforce the customer’s selected saved address through the database relation.
- **Recommended direction:** Pass a selected address ID, verify it belongs to the session user, and persist it on the order. Treat arbitrary shipping data separately if guest checkout is intended.

## Likely defects requiring runtime confirmation

### R-01 — New OAuth users may receive a stale empty-permission JWT

- **Severity:** High
- **Files:** `src/lib/auth.ts:108-166`
- **Evidence:** The JWT callback loads role/permissions when `user` exists. The `signIn` event separately assigns the default role only when it is absent. If the JWT callback precedes that event, the token receives fallback `role: "user"` with no permissions; `sessionVersion` is not incremented when the event adds the role, so later JWT calls may not reload permissions.
- **Confidence:** Medium; exact NextAuth callback/event ordering must be confirmed with an OAuth account test.
- **Impact if confirmed:** Newly registered OAuth users may be authenticated but lack customer capabilities until a later token-refresh condition.

### R-02 — OAuth initiation can race its own route replacement

- **Severity:** Medium
- **File:** `src/app/(auth)/sign-in/page.tsx:59-62`
- **Evidence:** `handleOAuthSignIn` schedules `router.replace("/sign-in")` immediately before starting the provider redirect. It also discards any return URL.
- **Confidence:** Medium; browser timing determines whether it is merely redundant or disrupts the auth navigation.
- **Recommended direction:** Let the OAuth sign-in call own its callback/navigation and use the same validated callback policy as credentials login.

### R-03 — Store/API failures silently leave checkout disabled

- **Severity:** Medium
- **Files:** cart and checkout store-loading/validation effects
- **Evidence:** Failed `/api/stores` and `/api/cart/validate-store` requests are ignored. Initial state remains no selected store or old validity state, while the checkout button is disabled with no recovery UI.
- **Confidence:** High for the failure behavior; runtime test is needed for final UX wording.
- **Recommended direction:** Track loading/error states and expose retryable feedback; do not silently treat an unknown validation result as a valid/invalid final state.

## Redirect findings: no loop confirmed

The following paths were traced and are not loops in current source:

- `/sign-in` with a valid JWT is redirected by `src/proxy.ts` to the role’s dashboard; the matching dashboard layout permits that role.
- Wrong role at `/admin/*`, `/store-manager/*`, or customer protected/profile routes redirects to `/access-denied`, which terminates the chain.
- Admin/store-manager settings pages repeat an authentication check under an already role-guarded layout, but do not redirect an authorized role elsewhere.
- `/profile` redirects once to `/profile/dashboard` under the customer user layout.

These are still worth regression tests because adding another redirect owner to sign-in, proxy, or layouts could create the loops reported by users.

## Expected behavior, not a React hydration error by itself

- `CartProvider` intentionally starts empty/loading and rehydrates from the database after mount; a temporary loading view on refresh is expected.
- The theme defaults to dark server-side, then reads `localStorage` after mount. A saved light theme can flash dark before switching; this is visual flicker, not by itself a React hydration mismatch.
- The root `auth()` makes pages dynamic. That affects caching/performance, not directly a redirect loop.

## Priority remediation order

| Priority | Work item | Why first |
| --- | --- | --- |
| P0 | Fix H-02 and H-03 with one safe post-login callback/role landing owner | Credentials login and protected-route continuation are broken now. |
| P0 | Resolve H-07 in a shared availability service | It can make checkout impossible for the global catalog. |
| P1 | Fix H-01 and H-04 as one provider/session-identity design | Removes the likely navbar flash and stale cross-session customer state. |
| P1 | Enforce or remove the email-verification requirement (H-05) | Current auth semantics conflict with the UI/security expectation. |
| P2 | Scope/clear store persistence and handle load failures (H-06, R-03) | Prevents incorrect cross-user selection and silent dead-end checkout. |
| P2 | Persist/validate order address (H-08) | Restores order-data integrity. |
| P2 | Reproduce R-01/R-02 with OAuth accounts | Confirms event ordering and redirects before changing NextAuth behavior. |

## Required regression scenarios

1. Credentials login from `/sign-in`, from `/sign-in?redirect=/cart`, and for each role; verify one landing navigation and no manual refresh needed.
2. OAuth first-login and returning-login for user/admin/store manager; verify role and permissions in the first session.
3. Logged-in customer refresh on home, cart, checkout, and profile; Navbar must not display anonymous controls after authenticated content is available.
4. Logout and session expiry within customer pages; verify cart/profile/address state clears before a guest or another user sees it.
5. User A selects a store, logs out, User B logs in, clears/selects a different store, and refreshes; verify deliberate scoped behavior.
6. Add a global product, make it available through `StoreInventory`, select that store, and complete client validation plus payment initiation.
7. Select a non-default address, initiate payment, and verify the persisted order address relation.
8. Visit all wrong-role route combinations and confirm a single terminating redirect to `/access-denied` without ping-pong.

## Audit limitations

- This was static code review; it did not capture actual browser hydration warnings, NextAuth network timing, OAuth callback ordering, or production database state.
- No code or test changes were made. Findings should be fixed as small, separately validated tasks rather than in one broad auth refactor.
