CHAATWALA — AUTH / SESSION / CART / REFRESH FLOW INVESTIGATION
MODE: READ-ONLY — DO NOT MODIFY ANY FILE

You are auditing the existing Chaatwala application.

IMPORTANT:
Do NOT fix, refactor, rewrite, or modify anything.
Do NOT create files.
Do NOT change dependencies.
Do NOT run commands that mutate the database.

Your first task is to deeply understand and document the current implementation.

==================================================

1. # PRIMARY INVESTIGATION GOAL

Investigate the complete lifecycle of:

Authentication
→ session creation
→ session persistence
→ session hydration
→ AuthProvider
→ UserDataProvider
→ role resolution
→ navbar rendering
→ CartProvider
→ cart persistence
→ store selection
→ address selection
→ checkout eligibility
→ browser refresh
→ server/client hydration
→ recovery after refresh

I am seeing this suspected bug:

1. User signs in.
2. User adds a product to cart.
3. User selects/adds a store.
4. User selects/adds an address.
5. Checkout button becomes enabled.
6. User accidentally refreshes the browser.
7. After refresh, some or all of the following appear missing:
   - cart
   - selected store
   - selected address
   - checkout eligibility
   - user state
8. Navbar initially renders "Sign In".
9. Shortly afterward it changes to the authenticated user state.

Determine whether this is:

- an actual data-loss bug,
- a state hydration race,
- a client/server rendering mismatch,
- stale context initialization,
- session hydration timing,
- incorrect localStorage/sessionStorage handling,
- cart persistence failure,
- API timing/race condition,
- React hydration behavior,
- loading-state problem,
- or a combination of these.

Do NOT assume the cause.

================================================== 2. FIRST: MAP THE ARCHITECTURE
==================================================

Inspect the entire relevant codebase.

Start with:

- app/layout.tsx
- customer layouts
- protected layouts
- user layout/page
- auth layout
- proxy.ts
- AuthProvider
- UserDataProvider
- CartProvider
- AppShell
- Navbar
- cart components
- checkout components
- store selection components
- address components
- session/auth utilities
- NextAuth configuration
- API routes related to:
  /api/auth
  /api/cart
  /api/cart/item/_
  /api/cart/validate-store
  /api/user/_
  /api/orders
  /api/payment/\*
- server actions related to:
  authentication
  user data
  cart
  address
  checkout

Also inspect:

- middleware/proxy behavior
- cookies
- localStorage
- sessionStorage
- URL state
- React context state
- server-side session retrieval
- client-side session retrieval
- initialSession / session hydration
- loading states
- useEffect initialization
- redirects

================================================== 3. BUILD A PROVIDER TREE
==================================================

Document the actual provider hierarchy.

Example format:

Root layout
├── ThemeProvider
├── AuthProvider
├── UserDataProvider
└── Toaster
│
└── Customer layout
├── AppShell
└── CartProvider
└── pages

Do not assume this structure.
Verify it from the code.

For every provider determine:

- where it mounts
- when it mounts
- what data it initializes
- whether initialization is async
- whether it has loading state
- whether it reads session
- whether it reads localStorage
- whether it makes API calls
- whether it depends on another provider
- whether it resets state during hydration
- whether it runs again after refresh

================================================== 4. SESSION LIFECYCLE
==================================================

Trace the session from login through page refresh.

Document:

LOGIN
↓
NextAuth
↓
session cookie/token
↓
server session
↓
client session
↓
AuthProvider
↓
UserDataProvider
↓
Navbar

Determine:

- Where is the authoritative session?
- Is session available during initial server render?
- Is session passed as initialSession?
- Does the client initially have null/undefined session?
- Does useSession() briefly return loading?
- Does Navbar render based on loading/session?
- Can Navbar render "Sign In" before session hydration completes?
- Does the server render authenticated markup while client initially renders anonymous markup?
- Is there a hydration mismatch?
- Is there merely a visual flash?
- Are there multiple sources of truth for authentication?

Explicitly identify every place that decides:

"Is the user authenticated?"

================================================== 5. USER DATA LIFECYCLE
==================================================

Trace:

session
→ user ID
→ user profile
→ role
→ managed store
→ addresses

Determine:

- Where user data is fetched.
- Whether it happens server-side or client-side.
- Whether it is fetched on every refresh.
- Whether UserDataProvider resets to null before fetching.
- Whether components render using stale/default values.
- Whether user data depends on session hydration.
- Whether role resolution happens more than once.
- Whether address data is persisted in DB or only React state.

================================================== 6. CART LIFECYCLE
==================================================

Trace the exact lifecycle.

Anonymous user:

product
→ add to cart
→ guest cart
→ cookie/session
→ database

Authenticated user:

login
→ user cart
→ add item
→ database
→ CartProvider
→ UI

Determine:

- What identifies the cart?
- userId?
- guest cookie?
- cart ID?
- combination?

Inspect:

- GET /api/cart
- POST /api/cart
- DELETE /api/cart
- PATCH /api/cart/item/[id]
- DELETE /api/cart/item/[id]
- validate-store

Determine what happens after browser refresh.

Specifically answer:

Does CartProvider:

A. restore cart from DB,
B. restore cart from localStorage,
C. restore cart from context only,
D. restore cart from cookie,
E. some combination?

Trace the exact sequence.

================================================== 7. STORE SELECTION
==================================================

Trace exactly where selected store lives.

Determine whether it is:

- database
- cookie
- localStorage
- sessionStorage
- URL
- React state
- CartProvider state
- checkout state

Then test the conceptual lifecycle:

Select store
→ checkout enabled
→ browser refresh
→ provider remount
→ state initialization
→ API request
→ final store state

Identify if selected store disappears because:

- it was never persisted,
- persistence exists but isn't restored,
- restoration occurs after checkout renders,
- restoration is overwritten by default state,
- API returns incomplete state,
- or another provider resets it.

================================================== 8. ADDRESS LIFECYCLE
==================================================

Do the same for address selection.

Trace:

address creation
→ address persistence
→ address selection
→ checkout state
→ refresh
→ restoration

Determine whether the selected address is persisted separately from the address itself.

IMPORTANT DISTINCTION:

"Address exists in DB"

does NOT necessarily mean:

"Selected checkout address survives refresh."

Identify both.

================================================== 9. CHECKOUT BUTTON STATE
==================================================

Find the exact logic controlling:

"Checkout enabled/disabled"

Document every condition.

For example:

cart exists
AND
cart items > 0
AND
store selected
AND
address selected
AND
session exists
AND
validation passed

Then determine what happens during refresh:

INITIAL STATE
↓
loading
↓
session hydration
↓
cart loading
↓
store loading
↓
address loading
↓
validation
↓
final checkout state

Identify whether the button can temporarily:

- become disabled
- become enabled incorrectly
- become disabled permanently
- show stale state

================================================== 10. NAVBAR FLASH INVESTIGATION
==================================================

Investigate this exact behavior:

Refresh
→ Navbar says "Sign In"
→ shortly afterward
→ Navbar shows authenticated user

Determine:

1. Is this expected session hydration?
2. Is server HTML anonymous?
3. Is client session initially undefined?
4. Is AuthProvider initializing after mount?
5. Is UserDataProvider delaying role/user rendering?
6. Is initialSession actually being used?
7. Is there a hydration mismatch?
8. Is there a loading-state bug?

Find the exact component responsible.

Give the precise render sequence.

================================================== 11. SERVER vs CLIENT RENDERING
==================================================

For all relevant components classify them:

SERVER
CLIENT
SERVER → CLIENT boundary

Pay particular attention to:

- Navbar
- AuthProvider
- UserDataProvider
- CartProvider
- checkout
- cart
- profile
- store selector
- address selector

Identify any state that is:

server-known but client-unknown.

================================================== 12. REFRESH SIMULATION
==================================================

Perform a READ-ONLY conceptual trace of this scenario:

SESSION A
User logged in.

STATE:
cart = item A
store = Store 1
address = Address 1

Then:

F5 / browser refresh

Trace every initialization step.

Create a timeline like:

T0:
Server request

T1:
Root layout

T2:
session retrieval

T3:
AuthProvider initialization

T4:
UserDataProvider initialization

T5:
Customer layout

T6:
CartProvider initialization

T7:
GET /api/cart

T8:
Store state initialization

T9:
Address state initialization

T10:
Checkout eligibility calculation

For each step state:

VALUE BEFORE
VALUE DURING
VALUE AFTER

================================================== 13. IDENTIFY ROOT CAUSE
==================================================

Do NOT simply list symptoms.

For every suspected bug classify it as:

A. Real persistence bug
B. Hydration race
C. Rendering flash
D. State initialization bug
E. API race
F. Context dependency bug
G. Session timing issue
H. Intentional behavior
I. Unknown — needs runtime instrumentation

For each issue provide:

- exact file
- component/function
- relevant code path
- state transition
- why it happens
- severity
- confidence level

================================================== 14. DO NOT MODIFY CODE
==================================================

This is an investigation only.

Do not:

- refactor
- optimize
- change providers
- change auth
- change redirects
- change APIs
- change database schema
- change permissions
- fix the bug

================================================== 15. FINAL REPORT
==================================================

Return the report in this exact structure:

# Chaatwala Auth / Session / Cart Flow Audit

## 1. Executive Summary

## 2. Actual Provider Architecture

## 3. Authentication Lifecycle

## 4. Session Hydration Lifecycle

## 5. UserData Lifecycle

## 6. Cart Lifecycle

## 7. Store Selection Lifecycle

## 8. Address Lifecycle

## 9. Checkout Eligibility Lifecycle

## 10. Navbar Rendering Lifecycle

## 11. Browser Refresh Timeline

## 12. Server vs Client Rendering Analysis

## 13. Confirmed Bugs

For each:

- Severity
- File
- Function/component
- Root cause
- Evidence
- User impact

## 14. Suspected Bugs

Same format, but clearly mark confidence.

## 15. False Positives / Expected Behavior

## 16. Race Conditions

## 17. State Ownership Problems

## 18. Multiple Sources of Truth

## 19. Recommended Fix Architecture

Do NOT implement it.

## 20. Minimal Fix Plan

Prioritize:

P0
P1
P2
P3

## 21. Test Scenarios

Create explicit manual and automated test cases for:

1. Anonymous → add cart → refresh
2. Login → existing cart → refresh
3. Login → add product → refresh
4. Login → select store → refresh
5. Login → select address → refresh
6. Login → cart + store + address → refresh
7. Logout → refresh
8. Session expiry → refresh
9. Multiple tabs
10. Navbar immediately after refresh
11. Slow network
12. Slow session response
13. Cart API failure
14. User API failure
15. Store API failure
16. Address API failure

For each test specify:

- initial state
- action
- expected result
- actual implementation behavior
- pass/fail based on code analysis

## 22. FINAL VERDICT

Answer these explicitly:

1. Is the cart actually persistent?
2. Is store selection persistent?
3. Is address selection persistent?
4. Is checkout state persistent or derived?
5. Is the Navbar flash a hydration issue?
6. Is there a server/client mismatch?
7. Is there a race condition?
8. What is the single biggest root cause?
9. What should be fixed first?
10. What should NOT be changed?
