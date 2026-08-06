# Project Architecture

## Overview
Chaatwala-Basic is a **monolithic Next.js 16 application** with a **feature-based modular architecture** inside a single `src/` directory. It serves as a food ordering platform (restaurant/cafe) with admin management, user ordering, and payment integration.

## Technology Stack
- **Framework**: Next.js 16.2.9 (App Router)
- **Runtime**: React 19.2.4, TypeScript 5 (strict)
- **Database**: PostgreSQL via Prisma 6.19.3
- **Authentication**: NextAuth v5 beta (JWT strategy) with PrismaAdapter
- **Authorization**: Custom RBAC with string-based permissions
- **Styling**: Tailwind CSS v4 + shadcn/ui (radix-nova) + Radix UI v1.6.0
- **Validation**: Zod v4.4.3
- **Payment**: SSLCommerz (Bangladesh payment gateway)
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Image Hosting**: imgbb (via custom abstraction)

## Folder Structure

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout with fonts and providers
│   ├── loading.tsx          # Global loading UI
│   ├── not-found.tsx        # Global 404 UI
│   ├── globals.css          # Global styles + CSS variables
│   ├── robots.ts            # robots.txt generation
│   ├── sitemap.ts           # sitemap.xml generation
│   ├── favicon.ico          # Favicon
│   ├── (admin)/             # Route group: Admin dashboard
│   ├── (auth)/              # Route group: Authentication pages
│   ├── (public)/            # Route group: Public-facing pages
│   ├── (user)/              # Route group: Authenticated user pages
│   ├── actions/             # Cross-cutting server actions
│   └── api/                 # REST API route handlers
├── components/              # React components
│   ├── ui/                  # shadcn/ui base components
│   ├── layout/              # App shell and layout primitives
│   ├── shared/              # Reusable app-wide components
│   ├── products/            # Product display components
│   ├── admin/               # Admin panel components
│   ├── account/             # User account components
│   ├── about/               # About page sections
│   ├── home/                # Home page sections
│   ├── special-offer/       # Promotional components
│   └── icons/               # SVG icon components
├── features/                # Feature-based business logic modules
│   ├── cart/                # Cart context, types, server actions
│   ├── orders/              # Order types and actions (incomplete)
│   ├── products/            # Product CRUD actions (incomplete types/queries)
│   └── address/             # Address CRUD server actions
├ contexts/                  # React Context providers
│   ├── auth-context.tsx     # Auth context wrapping SessionProvider
│   └── theme-context.tsx    # Dark/light theme toggle
├ hooks/                     # Custom React hooks
│   └── use-can.ts           # Permission checking hook
├ lib/                       # Shared utilities and services
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client singleton
│   ├── authorize.ts         # Authorization helpers
│   ├── permissions.ts       # Permission definitions and checks
│   ├── sslcommerz.ts        # Payment gateway service
│   ├── utils.ts             # cn() class utility
│   ├── image-upload/        # Image upload abstraction
│   └── validations/         # Zod schemas
└── proxy.ts                 # Middleware-like file (should be middleware.ts)
```

## Key Modules

### Authentication & Authorization
- **NextAuth v5** with JWT sessions in `src/lib/auth.ts`
- **RBAC**: Three roles (`admin`, `user`, `store_manager`) with string permissions
- **Permission Enforcement**: `authorize()` / `requirePermission()` in `src/lib/authorize.ts`
- **Client Hooks**: `useCan()`, `usePermissions()` in `src/hooks/use-can.ts`
- **Middleware**: `src/proxy.ts` for route-level redirects (needs to be `middleware.ts` at root)

### Cart & Orders
- **Cart**: Managed via React Context (`src/features/cart/context.tsx`) with server sync through API routes and Server Actions
- **Guest Support**: Guest cart via `chaatwala_guest_id` cookie; merges on login
- **Orders**: Created via `/api/orders` POST; payment status tracked via SSLCommerz

### Products
- **Models**: Dish, Drink, Combo in Prisma schema
- **Admin CRUD**: Server actions in `src/features/products/actions.ts`
- **Public Display**: Components in `src/components/products/`
- **Search**: `/api/search` and `/api/search/popular` endpoints

### Payment
- **Gateway**: SSLCommerz via `src/lib/sslcommerz.ts`
- **Flow**: Initiate → Redirect → Validate → Update Order
- **Order Fields**: `paymentStatus`, `sslTxnId`, `sslHash`, `idempotencyKey`

### Image Handling
- **Provider**: imgbb via `src/lib/image-upload/imgbb.ts`
- **Processing**: `sharp` for compression in `src/lib/image-upload/compress.ts`
- **Cleanup**: `imageDeleteUrl` stored on Dish/Drink for remote deletion

## Data Flow

### Client → Server
1. **Server Actions**: Client components call Server Actions directly (`"use server"` functions)
2. **API Routes**: Client components `fetch()` internal API routes for data not suitable for Server Actions
3. **Form Submissions**: Traditional forms with Server Action `action` attributes

### Server → Database
1. **Prisma Client**: All database access goes through `src/lib/prisma.ts`
2. **Validation**: Zod schemas in `src/lib/validations/` validate inputs before Prisma
3. **Authorization**: `authorize()` checks permissions before any mutation

### State Flow
```
Client Component
  ├── Server Action (mutation) → authorize() → validate() → Prisma → DB
  ├── fetch() to API Route → authorize() → validate() → Prisma → DB
  └── Context (Cart, Auth, Theme) ← Server Action / API response
```

## Reusability Patterns
- **Shared Components**: `src/components/shared/` (Navbar, Footer, ProductCard, FloatingCart)
- **UI Components**: `src/components/ui/` (shadcn/ui base)
- **Lib Services**: `src/lib/` (auth, authorize, sslcommerz, image-upload)
- **Feature Modules**: `src/features/` encapsulates actions, types, and context per domain
- **Path Aliases**: `@/*` maps to `./src/*` for clean imports
