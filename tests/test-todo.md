You are now in Chaatwala SQA FIX PHASE.

A complete automated SQA pass has already been executed.

Current result:

234 tests
234 passed
0 failed
29 test files passed

However, production readiness is NOT READY because verified defects remain.

DO NOT perform a broad refactor.

DO NOT add random optimizations.

DO NOT change business behavior unless required to fix a verified defect.

DO NOT weaken or remove tests.

DO NOT make tests pass by changing assertions.

==================================================
P0 — FIX #1
CROSS-USER CART MODIFICATION
==================================================

File:

src/features/cart/service.ts

Verified problem:

addToCart
updateCartItem
removeCartItem

do not adequately verify that the cart/item belongs to the authenticated user.

The current cart lookup uses findFirst in a way that can potentially select the wrong cart when multiple carts exist.

Required behavior:

User A must NEVER be able to:

- modify User B's cart
- update User B's cart item
- delete User B's cart item

Authorization must be enforced server-side.

Do not rely on the client or cart context for security.

Inspect the existing Prisma schema and current cart relationships first.

Use the existing data model.

Do NOT change the schema unless absolutely necessary.

Preserve existing legitimate cart behavior.

After fixing, run the existing cross-user cart security tests.

==================================================
P0 — FIX #2
PAYMENT REQUEST BODY DOUBLE CONSUMPTION
==================================================

File:

src/app/api/payment/initiate/route.ts

Verified problem:

request.json() is called twice.

The first call consumes the request body.

The second call cannot reliably retrieve the body.

As a result, shippingAddress can fall back to defaults.

Required solution:

Parse the request body exactly ONCE.

Example pattern:

const body = await request.json()

Then destructure/reuse the parsed object throughout the handler.

Do NOT call request.json() again later in the same request.

Preserve the existing payment flow.

Do not change SSLCommerz behavior unnecessarily.

Add/retain a regression test proving that:

shippingAddress
store information
order/cart information

remain available throughout payment initiation.

==================================================
P0 — FIX #3
CART PRICE HARDCODED TO ZERO
==================================================

File:

src/features/cart/service.ts

Verified problem:

addToCart creates a new cart item with:

price: 0

This causes incorrect cart totals when this service path is used.

Required behavior:

Cart item price must be derived from the trusted product/database pricing logic already used by the application.

Inspect how the API route currently calculates price.

Reuse the existing pricing/business rule instead of duplicating pricing logic.

Correctly handle:

regular price
discount price
quantity

Do NOT trust client-provided price.

The server must determine the effective price.

Do NOT break existing cart API behavior.

Add/retain tests proving:

database price = 200
client cannot force price = 1
cart item receives trusted price

Also test discounted products.

==================================================
P0 — BUILD FAILURE
==================================================

File:

src/app/(admin)/admin/orders/OrdersClient.tsx

Current error:

Cannot find name 'Button'

Line approximately:

156

Inspect the file and existing shadcn/ui Button implementation.

Add the correct import if Button is genuinely required.

Do not create a duplicate Button component.

Do not suppress the TypeScript error.

Then run:

npm run build

The build MUST complete successfully before this phase is considered complete.

==================================================
COMBO CRUD
==================================================

Reported missing:

createCombo
updateCombo
deleteCombo
getCombos

in:

src/features/products/actions.ts

Do NOT automatically implement this yet.

First inspect the current UI, Prisma schema, routes, and product architecture.

Determine whether Combo CRUD is:

A) genuinely required by the existing admin functionality

or

B) an incomplete/dead interface.

If the admin UI exposes Combo management and the feature is clearly intended to exist:

implement it consistently with the existing Dish/Drink CRUD architecture.

If it is not currently intended:

do not invent functionality.

Report the finding instead.

==================================================
TEST PRESERVATION
==================================================

The existing test suite contains 234 tests.

Before modifying production code:

run:

npm test

After modifications:

run:

npm test

Then:

npm run test:coverage

Then:

npm run build

Do NOT delete tests.

Do NOT skip tests.

Do NOT modify tests simply to make incorrect production behavior pass.

If an existing test expectation is genuinely inconsistent with the intended business rule, explain it before changing it.

==================================================
SECURITY VERIFICATION
==================================================

After fixes explicitly verify:

1. User A cannot modify User B's cart.
2. User A cannot delete User B's cart item.
3. Client cannot manipulate cart price.
4. Payment amount comes from trusted server-side pricing.
5. Payment request body is parsed only once.
6. Shipping address survives payment initiation.
7. Unauthorized admin/store operations remain protected.

==================================================
REGRESSION CHECK
==================================================

After fixes verify that these still work:

- add to cart
- update quantity
- remove item
- cart totals
- discounts
- checkout
- order creation
- payment initiation
- shipping address
- admin orders
- store manager functionality

==================================================
FINAL REPORT
==================================================

Return:

TESTS
234 baseline tests:
PASS/FAIL

New/modified tests:
<number>

Coverage:
statements
branches
functions
lines

BUILD:
PASS/FAIL

TYPECHECK:
PASS/FAIL

P0:
fixed / remaining

P1:
fixed / remaining

Combo CRUD:
implemented / intentionally deferred / not required

Production readiness:
READY / NOT READY

List every production file modified.

IMPORTANT:

Do not claim READY if:

- npm test fails
- npm run build fails
- TypeScript fails
- any P0 security issue remains
- payment integrity is not verified

Work only on the verified findings above.
