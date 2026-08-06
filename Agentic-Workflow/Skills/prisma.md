# Prisma Skill

## Overview
Prisma 6.19.3 ORM with PostgreSQL. Used for all database access in the Chaatwala-Basic project.

## Core Concepts
- **Schema**: `prisma/schema.prisma` defines 14 models including User, Role, Permission, RolePermission, Account, Session, VerificationToken, AuditLog, Dish, Drink, Cart, CartItem, Combo, Address, Order, OrderItem.
- **Client**: Singleton PrismaClient in `src/lib/prisma.ts` with global caching for development.
- **Migrations**: Managed via `prisma migrate dev` and `prisma db seed`.
- **Relations**: Many-to-many via `RolePermission` join table. One-to-many: User → Cart, Cart → CartItem, User → Address, User → Order, Order → OrderItem.

## Project-Specific Conventions
- **Model Names**: PascalCase (User, Role, Dish, Drink, Combo)
- **Field Names**: camelCase
- **IDs**: `id` (String, default `cuid()`)
- **Slugs**: Unique `slug` field on Dish, Drink, Combo
- **Prices**: `Decimal` type in Prisma; convert to `Number()` only at the API/UI boundary
- **Timestamps**: `createdAt`, `updatedAt` with `@default(now())`
- **Soft Deletes**: Not used; hard deletes via `delete`/`deleteMany`
- **Permissions**: String-based (`food:create`, `user:delete`, etc.) mapped via `RolePermission` join table

## Query Patterns
- Use `findUnique` for single records by unique fields (email, slug)
- Use `findFirst` for queries with non-unique `where` clauses (e.g., `userId` on Cart)
- Use `include` for eager loading relations; avoid N+1 queries
- Use `select` when returning partial objects from API routes
- Use transactions (`prisma.$transaction`) for multi-step operations (e.g., order creation with inventory-like checks)
- Use `upsert` for idempotent operations (e.g., role assignment in seed)

## Best Practices
- Always import from `@/lib/prisma` to use the singleton
- Never create a new `PrismaClient()` instance outside of the singleton
- Use `Number(field)` when returning Decimal values from API routes to avoid JSON serialization issues
- Use `orderBy` explicitly for lists that require deterministic ordering
- Validate all write inputs with Zod before passing to Prisma

## Common Mistakes to Avoid
- **N+1 queries**: Always eager-load required relations with `include` or `select`
- **Decimal serialization**: Prisma Decimal is not JSON-serializable; convert to `Number()` or `String()` before returning from API routes
- **Missing indexes**: Add `@@index` or `@@unique` for frequently queried fields (e.g., `email` on User is already unique)
- **Schema drift**: Always run `prisma migrate dev` after schema changes; never edit migrations manually
- **Client leaks**: The singleton pattern in `src/lib/prisma.ts` handles dev hot-reloading; do not instantiate clients inline
