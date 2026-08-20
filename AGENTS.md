# Chaatwala — Codex Agent Instructions

## Project
Chaatwala is a Next.js 16 + TypeScript + React 19 application using Prisma/PostgreSQL, Tailwind and shadcn/ui.

## Primary rule
Work from the existing source of truth. Do not redesign architecture unless the task explicitly asks for it.

Before modifying code:
1. Inspect the relevant route/layout/component/service.
2. Trace imports and callers.
3. Trace auth/session/role/permission behavior where applicable.
4. Check tests and existing conventions.
5. State the planned change briefly.
6. Make the smallest safe change.
7. Run targeted tests/typecheck/build as appropriate.
8. Report files changed, validation performed, and remaining risks.

## Architecture boundaries

### Root
`src/app/layout.tsx`
- Global providers only.
- Do not mount customer shell or CartProvider here.
- Avoid introducing customer-specific data fetching here.

### Customer
`src/app/(customer)/`
- Owns customer shell.
- `(customer)/layout.tsx` owns AppShell + CartProvider.
- Public, protected and user routes live below this boundary.
- Customer URLs must remain unchanged.

### Admin
`src/app/(admin)/`
- Owns AdminLayout/AdminShell.
- Must not mount CartProvider, AppShell, Navbar, Footer, FloatingCart or SearchBar.
- `/admin/*` is admin-only.

### Store Manager
`src/app/store-manager/`
- Owns StoreManagerLayout/StoreManagerShell.
- Must not mount customer shell.
- `/store-manager/*` is store-manager-only unless business requirements explicitly say otherwise.

### Auth
`src/app/(auth)/`
- Minimal auth layout.
- Authentication pages should not mount customer shell.

## Authorization model

Use `session.user.role` for role identity:
- `user`
- `admin`
- `store_manager`

Use permissions only for capabilities inside an already-authorized role boundary.

Never infer a user's role from permissions such as:
- `admin:access`
- `store:view`
- `user:access`

Role enforcement should have one clear owner per route. Prefer server-side layout/helper enforcement. Avoid competing proxy + page + client redirect chains.

## API security

Every mutating/protected API must enforce authorization on the server. Never rely on page visibility or client-side checks.

For resource mutation:
1. authenticate,
2. authorize role/capability,
3. verify resource ownership/store scope,
4. validate input,
5. perform mutation,
6. invalidate/revalidate relevant cache.

## Performance rules

- Keep server components server-side unless interactivity requires `"use client"`.
- Do not add client-side fetching when server props can provide the initial data.
- Do not move auth into the root layout merely to make client state convenient.
- Preserve customer/admin/store-manager shell isolation.
- Avoid accidental `/api/cart` or `/api/search` calls outside customer routes.
- Prefer existing caching patterns before inventing new ones.
- Do not optimize based only on theory; measure first.

## High-risk areas

Treat these as security-sensitive:
- auth/session helpers
- proxy
- route-group layouts
- payment APIs
- cart APIs
- order APIs
- upload APIs
- role/permission helpers
- Prisma ownership/store-scope queries

## Change discipline

Do not:
- rename routes without explicit approval,
- remove auth checks because a layout already checks them,
- broaden a role's access "for convenience",
- replace server authorization with client authorization,
- make unrelated formatting/refactoring changes,
- modify environment secrets,
- commit `.env` files.

## Definition of done

A task is complete only when:
- intended behavior is implemented,
- unauthorized paths are rejected,
- relevant tests pass,
- TypeScript/build validation passes when practical,
- no unrelated files were changed,
- the final response includes a concise change summary and validation results.
