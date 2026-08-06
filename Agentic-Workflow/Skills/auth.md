# Auth Skill

## Overview
Authentication and authorization system for Chaatwala-Basic. Uses NextAuth v5 beta with JWT sessions and a custom Role-Based Access Control (RBAC) layer.

## Core Concepts
- **NextAuth v5 (beta)**: `next-auth@^5.0.0-beta.31` with JWT session strategy
- **Providers**: Google OAuth, Facebook OAuth, Credentials (email/password)
- **Adapter**: `@auth/prisma-adapter` for database-backed users, accounts, and sessions
- **Session Augmentation**: JWT callback loads user role and permissions from DB; session callback exposes them client-side
- **RBAC**: String-based permissions (`food:create`, `user:delete`, etc.) mapped to roles (`admin`, `user`, `store_manager`)
- **Authorization Helpers**: `authorize()`, `requirePermission()` from `src/lib/authorize.ts`
- **Client Hooks**: `useCan()`, `usePermissions()` from `src/hooks/use-can.ts`

## Project-Specific Patterns
- **Auth Config**: `src/lib/auth.ts` — defines providers, callbacks, and session strategy
- **Permission Definitions**: `src/lib/permissions.ts` — `ROLE_PERMISSIONS`, `can()`, `canAny()`, `canAll()`, `createCan()`
- **Server-Side Guards**: Use `authorize()` in API routes and Server Actions:
  ```ts
  const { authorized, session } = await authorize({ permissions: "food:create" });
  if (!authorized) return unauthorizedResponse();
  ```
- **Client-Side Guards**: Use `useCan("food:create")` in components for conditional rendering
- **Middleware**: `src/proxy.ts` (must be at root as `middleware.ts`) checks auth and redirects unauthenticated users
- **Auto-Assign Role**: On sign-in, if a user has no role, assign the `user` role

## Best Practices
- Always enforce authorization server-side; never rely on client-side checks alone
- Load permissions in the JWT callback, not the session callback, to minimize client payload
- Use `requirePermission()` when you need the session object after authorization passes
- Hash passwords with `bcrypt` only in the Credentials provider authorize function
- Never expose permission arrays or role names in client bundles unnecessarily

## Common Mistakes to Avoid
- **Client-side-only auth**: UI hiding is not security; always check on the server
- **Missing middleware wiring**: `src/proxy.ts` is not automatically active; it must be `middleware.ts` at the project root
- **Duplicate auth pages**: Both `/sign-in` and `/signin` exist. Use `/signin` as canonical (matches NextAuth `pages.signIn` config)
- **Session callback overhead**: Do not query the database in the session callback; load permissions in JWT callback and pass through
- **Wildcard permission**: `*` grants all permissions; use sparingly and never expose it to untrusted input
