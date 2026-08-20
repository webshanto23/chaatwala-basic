# Chaatwala Security Audit Baseline

## Known high-priority findings to verify/fix

The previous read-only audit identified these issues. Re-check the current source before modifying anything.

### P0
1. `src/app/api/cart/item/[id]/route.ts`
   - PATCH/DELETE reportedly lacked authentication and ownership checks.
   - Required: authenticate and verify cart/item ownership, including guest-cart semantics if still supported.

2. `src/app/api/user/upload-image/route.ts`
   - Reportedly unauthenticated.
   - Required: authentication, input validation, upload limits/rate limiting.

3. `src/app/api/payment/validate/route.ts`
   - GET handler reportedly lacked authentication.
   - Payment callbacks/webhooks require special treatment: do not add ordinary session auth if the provider legitimately calls the endpoint server-to-server. Instead validate provider signatures/secrets and make validation idempotent.
   - Investigate before changing.

### P1
4. `src/app/store-manager/layout.tsx`
   - Reportedly allowed both `admin` and `store_manager`.
   - Business rule currently expected: store-manager area is store-manager-only.
   - Confirm before enforcing.

5. `src/app/api/store-manager/orders/[orderId]/route.ts`
   - Reportedly used `requireRole(["admin", "store_manager"])`.
   - Confirm intended business rule and store scope.

6. Settings pages
   - Add defense-in-depth role checks if they are server pages, but avoid duplicate redirect behavior.

### P2
7. Sign-in redirect competition
   - Proxy and sign-in page reportedly both redirect authenticated users.
   - Keep one redirect owner.

8. Change-password page/API
   - Verify whether authenticated users of all roles should be able to change their own password.
   - API must independently authenticate the caller.

### P3/P4
9. Clean role-marker permissions.
10. Review cart uniqueness and `findFirst` usage.
11. Add centralized `(user)/layout.tsx` only if it improves current architecture without creating new redirect ownership.
12. Update stale navigation data.

## Security verification checklist

For every protected API, test:

- anonymous request → 401/403
- wrong role → 403
- correct role + wrong resource → 403/404
- correct role + correct resource → success
- malformed input → 400/422
- repeated mutation → idempotency/rate-limit behavior where applicable

Never assume a page-level guard protects its API.
