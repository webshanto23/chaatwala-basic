# Chaatwala Auth / Session / Cart Flow Audit

Read-only audit completed. No files, dependencies, or database state were changed.

## 1. Executive Summary

The cart is persisted correctly in the database for both authenticated and guest users. The apparent post-refresh loss is primarily a client-state rehydration problem.

The main root cause is duplicated providers: `src/app/layout.tsx` creates an `AuthProvider` with the server session, but `src/components/layout/app-shell.tsx` creates another `AuthProvider` without it. Customer-facing components consume the inner provider, which starts in a loading/anonymous state and fetches the session after mount. That directly explains the Navbar’s temporary “Sign In” state.

Store selection normally survives refresh through `localStorage`. Address records survive in the database, but the explicitly selected address does not: selection is page-local state and refresh falls back to the default address. Checkout eligibility is derived, not persisted, and is temporarily disabled while cart/session/address/store state rehydrates.

## 2. Actual Provider Architecture

```text
RootLayout (server)
├── ThemeProvider A
├── AuthProvider A
│   └── SessionProvider(initialSession = await auth())
├── UserDataProvider A
├── route children
└── Toaster

CustomerLayout (server)
└── AppShell (client)
    ├── ThemeProvider B
    ├── AuthProvider B
    │   └── SessionProvider(session = undefined)
    ├── UserDataProvider B
    └── CartProvider
        ├── Navbar
        ├── SearchBar
        ├── customer page
        ├── Footer
        └── FloatingCart
```

Important consequence: customer components resolve the nearest provider—`AuthProvider B`, `UserDataProvider B`, and `ThemeProvider B`—not the root providers.

| Provider | Mount / initialization | Async work | Persistence |
|---|---|---|---|
| Root `AuthProvider A` | Root server layout | Receives server session as `initialSession` | NextAuth JWT cookie |
| Customer `AuthProvider B` | Every customer AppShell mount | NextAuth client session fetch after mount | NextAuth JWT cookie |
| `UserDataProvider` | Both root and customer trees | Only fetches `/api/user/me` when a consumer calls `refresh()` | DB, but provider state is memory-only |
| `CartProvider` | Customer AppShell | Calls `GET /api/cart` on mount | DB; guest identity cookie if anonymous |
| Store selection | Cart/checkout page state | Fetches `/api/stores`, then reads storage | `localStorage.selectedStoreId` |
| Address selection | Cart/checkout page state | Reads `UserDataProvider.addresses` | Address records are DB-backed; selected ID is not persisted |

## 3. Authentication Lifecycle

```text
Credentials / OAuth sign-in
→ NextAuth handler
→ JWT session cookie
→ future request: auth()
→ root layout passes session to AuthProvider A
→ customer AppShell creates AuthProvider B without that session
→ useSession() fetches session on the client
→ useAuth(), usePermissions(), Navbar update
```

Authoritative authentication state is the signed NextAuth JWT cookie, verified server-side by `auth()` in `src/lib/auth.ts`.

Authentication is decided in several places:

- Server route protection: customer protected/user layouts, admin layout, store-manager layout.
- Redirect convenience: `src/proxy.ts`.
- Client UI: `useAuth().auth.isAuthenticated`.
- Client role/permission UI: `usePermissions()` / `useSession()`.
- API and server-action protection: `auth()`, `authorize()`, `requireRole()`, and `requirePermission()`.

The server recognizes an existing valid session before rendering protected customer routes. The customer UI does not receive that known session because it uses the nested `AuthProvider B`.

## 4. Session Hydration Lifecycle

`RootLayout` does this correctly:

```ts
const session = await auth();
<AuthProvider initialSession={session}>
```

But customer AppShell subsequently does this:

```tsx
<AuthProvider>
  <UserDataProvider>
    <CartProvider>...</CartProvider>
```

The inner `SessionProvider` has no `initialSession`, so `useSession()` initially reports a loading state. In `InnerAuthProvider`, that maps to:

```ts
isAuthenticated: status === "authenticated"
```

Therefore it initially exposes:

```text
isAuthenticated = false
role = null
permissions = []
```

Then NextAuth resolves the session and the customer UI updates.

This is not primarily session loss. It is client session hydration timing caused by an unnecessary, unseeded nested provider.

## 5. UserData Lifecycle

`UserDataProvider` starts each mount with:

```text
profile = null
addresses = []
isLoading = true
```

It does not automatically load data. Consumers must call `refresh()`.

- Cart and checkout pages call `refresh()` only after client `auth.isAuthenticated` turns true.
- The profile dashboard calls `refresh()` on mount.
- `refresh()` requests `GET /api/user/me`.
- `/api/user/me` reads the authenticated user and all addresses from PostgreSQL.
- The API returns the default address, or the first address, as the profile phone source.

After refresh, address data is restored from the DB. Until then, customer pages render with empty addresses and `isLoading: true`.

Role resolution occurs twice in practice:

1. Server-side in `auth()` and protected layouts.
2. Client-side when the inner SessionProvider fetches/hydrates its session.

## 6. Cart Lifecycle

### Anonymous user

```text
Add item
→ POST /api/cart
→ guest ID cookie (chaatwala_guest_id)
→ Cart.guestId in DB
→ CartItem records in DB
→ CartProvider state
```

### Authenticated user

```text
Add item
→ POST /api/cart
→ session.user.id
→ Cart.userId in DB
→ CartItem records in DB
→ CartProvider state
```

On every customer AppShell mount, `CartProvider` calls `GET /api/cart`.

`GET /api/cart`:

- resolves the server session,
- uses `userId` if authenticated,
- otherwise resolves/creates the guest cookie,
- retrieves or creates the DB cart,
- returns the serialized cart.

Therefore CartProvider uses:

- **A. DB restore:** yes.
- **B. localStorage:** no.
- **C. context only:** no; context is only the current UI cache.
- **D. cookie:** yes, only to identify anonymous carts.
- **E. combination:** DB plus auth session or guest-ID cookie.

The cart itself should return after a browser refresh. It starts visually empty/loading and then becomes populated after `GET /api/cart` resolves.

A separate issue: there is no observed guest-cart-to-user-cart merge during login. A guest cart remains in the DB but becomes inaccessible after authentication because requests switch from `guestId` to `userId`.

## 7. Store Selection Lifecycle

Selected store lives in two places:

- Current page: `selectedStoreId` React state.
- Browser persistence: `localStorage["selectedStoreId"]`.

Flow:

```text
Select a store
→ setSelectedStoreId(storeId)
→ localStorage.setItem("selectedStoreId", storeId)
→ refresh
→ selectedStoreId starts null
→ GET /api/stores
→ read localStorage
→ restore ID only if it still exists in API result
→ validate cart inventory against that store
```

It is not in the database, cart, cookie, URL, or provider state.

The selection normally survives a refresh, but only after `/api/stores` returns. It is temporarily null beforehand, so checkout is temporarily disabled.

It is global to the browser origin, not scoped by user, cart, tab, or checkout session. Switching accounts in the same browser can retain the previous user’s store selection.

## 8. Address Lifecycle

Address records are persisted in PostgreSQL through server actions and address APIs.

Checkout address selection is different:

```text
selectedAddressId = React useState(null)
shippingAddress = selected address, otherwise default address, otherwise first address
```

On an address save:

```text
AddressFormModal
→ createAddress/updateAddress server action
→ DB
→ page sets selectedAddressId(new ID)
→ UserDataProvider.refresh()
```

On refresh:

```text
selectedAddressId resets to null
→ addresses load from /api/user/me
→ page chooses default address, else first address
```

Thus:

- The address itself persists.
- The specifically selected address does not persist.
- First address creation becomes the default, so it appears to survive refresh.
- A later non-default address selected during the current page session will be replaced by the default/first address after refresh.

There is no actual address-selector UI in cart/checkout; the displayed address is default/fallback, with the modal used mainly for editing or adding.

## 9. Checkout Eligibility Lifecycle

Both cart and checkout pages disable their payment button when:

```text
isProcessing / isPlacing
OR cart.items.length === 0
OR no resolved shipping address
OR no selected store
OR storeInvalid
```

Authentication is also checked inside the submit handler.

Refresh sequence:

```text
Initial:
cart = []
address = null
selectedStoreId = null
storeInvalid = false
button = disabled

After session hydration:
auth.isAuthenticated = true
UserDataProvider.refresh() begins

After cart API:
cart items restored

After /api/user/me:
addresses restored; default/fallback address resolves

After /api/stores:
saved selected store restored

After /api/cart/validate-store:
storeInvalid becomes authoritative
button reaches final state
```

The button can:

- Temporarily be disabled during normal hydration: confirmed.
- Be briefly enabled before inventory validation resolves: possible.
- Remain disabled after store API failure or no valid saved store: expected from current state.
- Appear enabled if store validation fails at network level, because errors are ignored and `storeInvalid` remains false; backend payment initiation independently revalidates stock.

## 10. Navbar Rendering Lifecycle

The responsible component is `src/components/shared/Navbar.tsx`.

It directly renders “Sign In” when:

```ts
const isLoggedIn = auth.isAuthenticated;
!isLoggedIn
```

Precise refresh sequence:

```text
1. Customer AppShell mounts.
2. Nested AuthProvider B has no initial session.
3. useSession() is loading.
4. useAuth() exposes isAuthenticated = false.
5. Navbar renders Sign In and public links.
6. NextAuth fetches/resolves the session cookie.
7. AuthProvider B rerenders with authenticated state.
8. Navbar rerenders Logout and role-appropriate links.
```

This is expected given the current provider setup, but it is a UX bug because the application already knew the session on the server.

The initial root server session is not used by Navbar, because Navbar is inside the inner provider.

## 11. Browser Refresh Timeline

Assuming a signed-in user has cart item A, Store 1 selected, and Address 1 selected:

| Time | State before / during | State after |
|---|---|---|
| T0: Request | Browser sends session and guest cookies | Server can authenticate user |
| T1: Root layout | `auth()` reads JWT | Root has authenticated session |
| T2: Protected layout | Server verifies user role | Request remains allowed |
| T3: Root providers | AuthProvider A receives session | But customer UI will not consume it |
| T4: Customer AppShell | New AuthProvider B mounts | Session is loading / anonymous client state |
| T5: Navbar | `isLoggedIn = false` | Shows “Sign In” |
| T6: CartProvider | Cart defaults empty/loading | Starts `GET /api/cart` |
| T7: Cart API | Server reads real session | DB cart A returns |
| T8: UserData | Addresses initially empty/loading | Once inner session resolves, page calls `/api/user/me` |
| T9: Store state | Starts `null` | `/api/stores` returns, then localStorage restores Store 1 |
| T10: Address state | `selectedAddressId` resets null | Default/first DB address becomes active; not necessarily prior Address 1 |
| T11: Validation | `storeInvalid = false` initially | Store inventory request sets final validity |
| T12: Final UI | All fetches complete | Cart present, store restored if valid, default address shown, Navbar authenticated |

## 12. Server vs Client Rendering Analysis

| Component / layer | Classification | Notes |
|---|---|---|
| Root layout | Server | Retrieves session with `auth()` |
| Protected/user/customer layouts | Server | Enforce authenticated customer role |
| AppShell | Client boundary | Adds duplicate providers |
| Navbar | Client | Uses inner client session state |
| CartProvider | Client | Fetches cart after mount |
| Cart page | Client | Own selection and checkout state |
| Checkout page | Client | Own selection and checkout state |
| UserDataProvider | Client | Fetches only on explicit `refresh()` |
| Store API / cart API / user API | Server handlers | Read cookies/session authoritatively |

The most important server-known/client-unknown state is the authenticated session: it is known by RootLayout, but the customer AppShell’s nested SessionProvider starts without it.

This is mostly a rendering flash/state-timing issue, not a React hydration markup mismatch. Server and client can both initially render the inner provider’s anonymous/loading state, then update after client session fetch. The visual result is still incorrect and distracting.

## 13. Confirmed Bugs

### Duplicate auth/provider tree

- Severity: P1
- File: `src/components/layout/app-shell.tsx`
- Function/component: `AppShell`
- Root cause: It mounts `ThemeProvider`, `AuthProvider`, and `UserDataProvider` even though all exist in root layout.
- Evidence: Root provider receives `initialSession`; nested AuthProvider does not.
- User impact: Navbar briefly shows “Sign In”; public links flash; user data starts from a separate empty state; redundant contexts make behavior harder to reason about.

### Selected address does not persist

- Severity: P1
- File: `src/app/(customer)/(protected)/cart/page.tsx`, `src/app/(customer)/(protected)/checkout/page.tsx`
- Function/component: `CartPage`, `CheckoutPage`
- Root cause: `selectedAddressId` is page-local `useState`, with no persisted selection.
- Evidence: On refresh it initializes to `null`, then selects only DB default/first address.
- User impact: A user who selected a non-default address can unknowingly pay using the default address after refresh.

### Guest cart is not merged on login

- Severity: P1
- File: `src/app/api/cart/route.ts`
- Function/component: `getOrCreateCart`
- Root cause: Requests use either `userId` or `guestId`; no login-time transfer/merge is implemented.
- Evidence: No auth callback or cart route logic locates and merges the guest cart after sign-in.
- User impact: Items added before login disappear from the signed-in user’s cart view, despite remaining in the guest cart DB record.

### Store selection is cross-account browser state

- Severity: P2
- File: cart and checkout pages
- Function/component: `handleStoreChange` and store-restoration effect
- Root cause: Plain global `localStorage["selectedStoreId"]`.
- Evidence: No user/cart namespace or logout cleanup.
- User impact: A different account on the same browser inherits the prior account’s store selection.

## 14. Suspected Bugs

### Cart duplicate-record risk

- Severity: P2
- File: `src/app/api/cart/route.ts`
- Function/component: `getOrCreateCart`
- Confidence: Medium
- Root cause: `Cart.userId` is not unique in the schema, and cart lookup uses `findFirst`.
- Evidence: Concurrent first cart requests could both create carts; later reads are nondeterministic.
- User impact: Potential intermittent “missing” items if multiple user carts exist.

### Inventory validation can be visually bypassed on network failure

- Severity: P2
- File: cart and checkout validation effects
- Function/component: store-validation `useEffect`
- Confidence: High
- Root cause: Failed validation requests are ignored, leaving `storeInvalid` as false.
- Evidence: `catch { /* ignore */ }`.
- User impact: Checkout can look available until payment initiation rejects it server-side.

### Login flow lacks a success redirect

- Severity: P2
- File: `src/app/(auth)/sign-in/page.tsx`
- Function/component: `handleSubmit`
- Confidence: High
- Root cause: credential sign-in uses `redirect: false`, then no post-success navigation occurs.
- User impact: User may remain on sign-in page until navigating or refreshing.

## 15. False Positives / Expected Behavior

- Cart initially displaying a loading state after refresh is expected client data rehydration, not cart data loss.
- Checkout being disabled briefly during address/store/cart recovery is expected given asynchronous client initialization.
- The store selection is restored only after `/api/stores` validates its ID; this is intentional defensive behavior.
- The server protecting `/cart`, `/checkout`, and user pages despite a temporary client “Sign In” Navbar state is correct server-side authorization behavior.
- A first address persists as the selected-looking checkout address because it is made default, not because `selectedAddressId` itself persists.

## 16. Race Conditions

- Session hydration versus customer page effects: `auth.isAuthenticated` starts false, then flips true.
- Cart retrieval versus role hydration: CartProvider fetches before inner session hydration completes; server still receives the auth cookie, so ordinary customer carts recover correctly.
- Store restoration versus checkout rendering: `selectedStoreId` is null until store API completion.
- Address restoration versus checkout rendering: address is null until `/api/user/me` completes.
- Inventory validation versus button state: button can be enabled between store restoration and validation response.
- Same-page fetch duplication: cart/checkout both can call UserData `refresh()` after auth hydration; provider does not deduplicate these requests.

## 17. State Ownership Problems

| State | Current owner | Problem |
|---|---|---|
| Session | JWT cookie + two SessionProviders | Client has duplicated authentication contexts |
| User profile / addresses | DB + two UserDataProviders | Customer uses a separate, initially empty provider |
| Cart | DB + CartProvider state | Correct persistence, but no guest-to-user merge |
| Selected store | Page state + global localStorage | Shared across pages/accounts, async restoration |
| Selected address | Page state | Lost on remount/refresh |
| Checkout eligibility | Derived page state | Correctly not persisted, but dependent on racing loads |

## 18. Multiple Sources of Truth

- Authentication: server `auth()`, root SessionProvider, nested SessionProvider, `useAuth`, direct `useSession`, `usePermissions`, and proxy JWT reads.
- User data: database, root UserDataProvider, nested UserDataProvider, and direct session fields.
- Addresses: database default flag, `UserDataProvider.addresses`, and page-local `selectedAddressId`.
- Store: page-local state plus localStorage.
- Cart: database cart records plus CartProvider’s in-memory projection.

The highest-risk duplication is not the server-vs-client distinction; it is root and customer trees both owning authentication and user-data contexts.

## 19. Recommended Fix Architecture

Do not implement in this audit.

Use one provider tree only:

```text
RootLayout
├── ThemeProvider
├── AuthProvider(initialSession)
├── UserDataProvider
├── CartProvider
└── all route content
```

Then:

- Remove provider duplication from AppShell.
- Keep `CartProvider` inside the one shared authenticated tree, or mount it in a single customer-specific provider layout that receives the same session source.
- Make `UserDataProvider` own its own session-aware loading lifecycle, instead of requiring every page to call `refresh()`.
- Represent selected checkout address explicitly and persist it appropriately: user preference in DB, cart/checkout record, or scoped browser storage depending on product requirements.
- Scope the store selection by user/cart and restore it deterministically.
- Add a guest-cart merge after login.
- Make validation loading explicit, rather than treating failed or pending validation as valid.

## 20. Minimal Fix Plan

### P0

- No confirmed data-destruction defect in the ordinary refresh flow. Do not replace DB-backed cart persistence.

### P1

- Remove the nested `AuthProvider`, `UserDataProvider`, and `ThemeProvider` from AppShell so customer UI consumes the server-seeded root session.
- Persist or explicitly define the intended fallback semantics for selected address.
- Implement guest-cart merge at sign-in.

### P2

- Add loading/error states for store inventory validation and prevent checkout while validation is pending or failed.
- Scope/clear selected store storage by user/cart.
- Resolve the cart uniqueness invariant (`Cart.userId` / concurrent create behavior).
- Add a successful credentials-sign-in redirect.

### P3

- Centralize checkout state so cart and checkout pages do not duplicate store/address/validation logic.
- Add request deduplication for user data refreshes.
- Consolidate direct `useSession()` usage behind a coherent app-level auth interface where practical.

## 21. Test Scenarios

| Scenario | Initial state / action | Expected result | Current behavior | Result |
|---|---|---|---|---|
| 1. Anonymous add cart → refresh | Guest adds item, refreshes | Same guest cart returns | Guest cookie identifies DB cart; CartProvider refetches | Pass |
| 2. Login → existing cart → refresh | User already owns cart | Same user cart returns | API queries by session user ID | Pass |
| 3. Login → add product → refresh | Signed-in user adds item | Item returns | DB-backed cart restored after loading | Pass |
| 4. Login → select store → refresh | Valid saved store ID | Store restored | localStorage restored after `/api/stores` | Pass, delayed |
| 5. Login → select address → refresh | Non-default address selected | Same selected address returns | Falls back to default/first address | Fail |
| 6. Cart + store + address → refresh | All ready before F5 | Final eligible state restored | Cart/store/default address recover asynchronously; selected non-default does not | Conditional fail |
| 7. Logout → refresh | Session removed | Anonymous UI/cart behavior | Server and client become anonymous; guest cart may be created/read | Pass |
| 8. Session expiry → refresh | Expired JWT | Redirect from protected route | Server protected layout redirects to sign-in | Pass |
| 9. Multiple tabs | Store selected in tab A | Defined synchronized behavior | localStorage is shared but no `storage` listener updates tab B state | Fail / undefined |
| 10. Navbar immediately after refresh | Authenticated customer refreshes | Authenticated Navbar immediately | Inner SessionProvider starts loading; “Sign In” flashes | Fail |
| 11. Slow network | Delayed client APIs | Explicit loading and safe checkout | Cart shows loading; address/store are incomplete; button disabled | Mostly pass |
| 12. Slow session response | Delayed NextAuth session fetch | No anonymous auth flash | Navbar shows Sign In until inner session resolves | Fail |
| 13. Cart API failure | `/api/cart` fails | Recoverable error state | CartProvider records error but cart page only gates on loading; no clear recovery UI | Partial fail |
| 14. User API failure | `/api/user/me` fails | Error and retry path | Provider stores error, but cart/checkout do not display it; address stays absent | Partial fail |
| 15. Store API failure | `/api/stores` fails | Explicit selection error | Error is ignored; store remains null and checkout disabled | Partial fail |
| 16. Address API failure | Address load fails | No false eligibility | No address means checkout remains disabled | Pass safely, poor UX |

## 22. FINAL VERDICT

1. **Is the cart actually persistent?**  
   Yes. It is database-backed and restored through `GET /api/cart`; guests use a persistent HTTP-only guest ID cookie.

2. **Is store selection persistent?**  
   Yes, in `localStorage`, not in the database. It restores asynchronously and is not user-scoped.

3. **Is address selection persistent?**  
   The address records are persistent. The explicitly selected address is not; refresh falls back to default/first address.

4. **Is checkout state persistent or derived?**  
   Derived. It is recalculated from cart contents, current address fallback, selected store, and inventory validation.

5. **Is the Navbar flash a hydration issue?**  
   Yes. Specifically, it is caused by the nested unseeded `AuthProvider` in customer AppShell.

6. **Is there a server/client mismatch?**  
   There is a server-known/client-unknown session problem. It is more accurately a client hydration/initialization flaw than a hard React hydration markup mismatch.

7. **Is there a race condition?**  
   Yes: session, cart, addresses, stores, and inventory validation initialize independently. The UI is eventually consistent but temporarily incomplete.

8. **What is the single biggest root cause?**  
   Duplicated provider ownership in AppShell, especially the nested `AuthProvider` that discards the server-provided initial session.

9. **What should be fixed first?**  
   Eliminate duplicate customer providers so the UI uses the one root `AuthProvider(initialSession)` and one user-data context.

10. **What should NOT be changed?**  
    Do not replace the database-backed cart with localStorage; its persistence model is fundamentally sound. Do not weaken the server-side protected layouts or API-side session validation.
