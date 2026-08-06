# SSLCommerz Skill

## Overview
Payment gateway integration using `sslcommerz-lts` (v1.2.0) for the Chaatwala-Basic project. Handles payment initiation and validation callbacks.

## Core Concepts
- **Initiate Payment**: Creates a transaction with SSLCommerz and returns the gateway URL for redirect
- **Validate Payment**: Verifies the payment callback from SSLCommerz using server-side hash validation
- **Order Model**: Stores `sslTxnId`, `sslAmount`, `sslHash`, `paymentStatus`, `paymentMethod` on the `Order` model
- **Idempotency**: Uses `Order.idempotencyKey` to prevent duplicate payment initiations

## Project-Specific Patterns
- **Service File**: `src/lib/sslcommerz.ts` — exports `initiatePayment()`, `validatePayment()`, `generateHash()`
- **API Routes**:
  - `POST /api/payment/initiate` — accepts cart/order data, calls `initiatePayment()`, returns GatewayPageURL
  - `GET/POST /api/payment/validate` — handles SSLCommerz callback, calls `validatePayment()`, updates Order status
- **Payment Flow**:
  1. User proceeds to checkout
  2. Client calls `/api/payment/initiate` with order details
  3. Server creates Order with `paymentStatus: "pending"`, calls `initiatePayment()`
  4. User redirected to SSLCommerz GatewayPageURL
  5. SSLCommerz calls `/api/payment/validate` with `val_id`
  6. Server validates, updates Order status to `paid` or `failed`

## Best Practices
- Always validate the `sslHash` server-side; never trust client-provided validation status
- Store `sslTxnId` and `sslHash` on the Order for audit and dispute resolution
- Use `idempotencyKey` (UUID) on Order to prevent duplicate transactions
- Map SSLCommerz statuses (`VALID`, `VALIDATED`, `FAILED`) to internal `paymentStatus` enum
- Log payment initiation and validation events to `AuditLog` for traceability
- Use HTTPS endpoints in production; SSLCommerz requires secure callbacks

## Common Mistakes to Avoid
- **Hardcoded values**: Delivery fee (`50`), phone (`01700000000`), and country (`BD`) are hardcoded. Move to order/address data or configuration.
- **Missing hash validation**: Always call `generateHash()` with store credentials and validate the response hash
- **Uncaught statuses**: Handle all SSLCommerz status codes; do not assume success
- **Missing idempotency**: Without `idempotencyKey`, users can accidentally trigger duplicate payments
- **Client-side status updates**: Do not update `paymentStatus` from the client; wait for the server-side callback
