# Project Memory

## History

### 2026-08-06 — Admin/Customer Route Separation & UX Hardening
- Updated `src/proxy.ts` to redirect admins away from customer routes (`/cart`, `/checkout`, `/orders`) to `/admin/dashboard`
- Removed `/cart` from `publicPaths` in proxy so it is no longer treated as a public route
- Added `user:access` requirement for `/cart` and `/checkout` in `getPermissionRule`
- Disabled add-to-cart buttons for admins in `ProductCardActions`, `ProductDetailClient`, and `ComboCard`
- Extended `AuthState` in `auth-context.tsx` to expose `permissions` array for client-side admin checks
- Refactored customer `orders/page.tsx` from client-side API fetch to server component using `features/orders/service.ts` directly
- Extracted `OrdersList` client component for order rendering; eliminated `/api/my-orders` round-trip

### 2026-08-06 — Admin Routing Architecture Refactor
- Resolved Next.js route conflict: admin `orders` and protected `orders` both resolved to `/orders`
- Fixed by nesting admin pages under `(admin)/admin/` to preserve `/admin/*` URL segments while keeping route-group layout
- Final admin structure: `(admin)/admin/{dashboard,users,roles,orders,audit,products/{dishes,drinks,combos}}/page.tsx`
- Moved user-required pages into `(protected)/`: `cart/`, `checkout/`, `orders/`
- Extracted admin UI shell to `components/admin/admin-shell.tsx`
- Single layout per group enforced: `(admin)/layout.tsx`, `(protected)/layout.tsx`, `(public)/layout.tsx`, `(auth)/layout.tsx`
- Updated sidebar links to domain paths: `/admin/products/*`, `/admin/audit`, etc.
- Fixed `sitedata.json` import path in admin combos page after restructure

### 2026-08-06 — Architecture Refactor: Service Layer & Route Consolidation
- Created `src/features/auth/service.ts`, `src/features/products/service.ts`, `src/features/cart/service.ts`, `src/features/orders/service.ts`
- Removed duplicate auth page `src/app/(auth)/signin/page.tsx`; updated sign-up link to `/sign-in`
- Deleted `src/app/(public)/products/page.tsx` redirect; updated `sitedata.json` navigation hrefs to `/products/dishes`
- Created public layout `src/app/(public)/layout.tsx`, protected layout `src/app/(protected)/layout.tsx`, and admin layout `src/app/admin/layout.tsx`
- Converted homepage `page.tsx` to server component using new product services
- Removed `sqlNotes` from `sitedata.json`

### 2026-08-06 — Performance Refactor Sprint
- Centralized homepage data fetching in `src/lib/data/home.ts`
- Removed Prisma calls from individual home components (`SignatureFromDb.tsx`)
- Reduced homepage DB calls from 3 to 2 via `Promise.all` with `select`
- Fixed NextAuth JWT callback to avoid DB hit on every request (was loading permissions on every JWT decode)
- Auth session now <100ms (JWT-only decode after sign-in)
- Added `export const runtime = "edge"` to static pages: robots.ts, about, privacy-policy, terms-and-conditions, license
- Added `select` optimization to product detail Prisma queries
- Updated `page.tsx` to fetch data server-side and pass as props to child components

### 2026-08-06 — Agentic Workflow System Setup
- Created structured `Agentic-Workflow/` system with Agents, Skills, and Memory
- Documented architecture, conventions, and tech stack for future AI agents

### 2026-07-29 — Payment Fields Migration
- Migration `20260729000001_add_payment_fields` added payment tracking to Order model
- Fields: `paymentStatus`, `sslTxnId`, `sslAmount`, `sslHash`, `paymentMethod`
- Added idempotency support via `idempotencyKey` on Order
- SSLCommerz integration completed with initiate and validate endpoints

### 2026-07-18 — Initial Schema Migration
- Migration `20260718074601_init` created the foundational database schema
- Models: User, Role, Permission, RolePermission, Account, Session, VerificationToken, AuditLog
- Product models: Dish, Drink, Combo
- Transactional models: Cart, CartItem, Order, OrderItem, Address

### v0.1.0 — Core Features
- **Authentication**: NextAuth v5 beta with Google, Facebook, and Credentials providers
- **RBAC**: Custom string-based permission system with `admin`, `user`, and `store_manager` roles
- **Admin Dashboard**: Users, roles, audit logs, dishes, drinks, combos, orders management
- **Public Storefront**: Home page, about page, product listings (dishes, drinks, combos), product detail pages
- **User Area**: Profile, address management, order history, checkout flow
- **Cart**: Guest and authenticated cart support via cookie-based guest ID
- **Search**: Product search and popular tags endpoints
- **Image Upload**: imgbb integration with sharp compression
- **Audit Logging**: Action tracking for sensitive operations

## Architecture Decisions

- **Next.js 16 + App Router**: Chosen for modern React patterns and built-in Server Components
- **Prisma + PostgreSQL**: Type-safe ORM with relational data model suited for RBAC and order management
- **NextAuth v5 beta**: JWT strategy for session management; PrismaAdapter for database-backed sessions
- **Custom RBAC over next-auth RSC**: String-based permissions provide fine-grained control; not using built-in RSC
- **Server Actions + API Routes**: Dual mutation layer; Server Actions for form-heavy admin, API routes for client `fetch()`
- **React Context for Cart/Auth/Theme**: Lightweight client state without external state libraries
- **shadcn/ui radix-nova**: Design system foundation; avoids dependency on external CSS frameworks
- **Tailwind CSS v4**: Utility-first styling with CSS variable theming
- **Domain-driven admin routing**: Admin pages grouped by domain (`products/*`, `users`, `orders`, `roles`, `audit`) under single `(admin)` route group with auth-guarded layout
- **Protected route group**: User-required pages (`cart`, `checkout`, `orders`) isolated under `(protected)` with server-side auth guard

## Known Issues

- Hardcoded payment values (delivery fee, phone, country) in `src/lib/sslcommerz.ts`
- `src/proxy.ts` is not wired as Next.js middleware (missing root `middleware.ts`)
- Price formatting inconsistency: admin pages use `$${price}` while public pages use `৳`
- `ProductCard` component does not support `combo` product type

## Deploy Log

> **Rule**: After every successful deploy, append the following:
> - **What changed**: [description]
> - **Why it changed**: [rationale]
> - **Impact**: [affected features, performance, risk]
