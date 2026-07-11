# 🍽️ Chaatwala — SaaS Food Ordering & Admin Platform

## 🚀 Project Overview

**Chaatwala** is a modern SaaS-based food ordering platform built with **Next.js, Prisma, PostgreSQL, and NextAuth**, featuring a **production-grade RBAC (Role-Based Access Control) system**.

The project is designed to support both **customer-facing features** and a powerful **admin dashboard** with granular permission control.

---

## 🧠 Current Architecture

### 🔐 Authentication & Authorization

* **NextAuth (JWT-based) authentication**
* **Database-driven RBAC system**
* Dynamic **roles & permissions**
* Centralized **permission helpers (`can()`)**
* Middleware-based route protection
* Backend API-level authorization (secure)

---

### 🧩 RBAC System (Core Feature)

#### Roles

* `user`
* `admin`
* `store_manager` (future-proof; manage food items)

> There is **no `super_admin`**. Authorization is fully **permission-based** — every
> check resolves to a permission, never a hardcoded role name.

#### Permissions

Defined in **one place**: `src/lib/permissions.ts` (`USER_PERMISSIONS`,
`ADMIN_PERMISSIONS`, `ROLE_PERMISSIONS`). The seed script consumes the same
source of truth so code and database can never drift.

**User (customer):**
`order:create`, `payment:create`, `food:view`, `food:like`, `food:share`, `feedback:create`, `user:access`

**Admin:**
`user:access`, `user:view`, `user:updateRole`, `user:delete`, `food:create`,
`food:update`, `food:delete`, `admin:create`, `admin:delete`, `role:manage`,
`audit:view`, `admin:access`

**Store manager (future):** `user:access`, `food:view`, `food:create`, `food:update`, `food:delete`, `user:view`

#### How it works

1. On login the JWT is populated with the user's `role` **and** the resolved
   `permissions` array (`src/lib/auth.ts` → `loadUserPermissions`).
2. Route protection (`src/proxy.ts`) and server actions / API routes
   (`src/lib/authorize.ts` → `authorize()` / `requirePermission()`) check
   **permissions**, never the role string.
3. Frontend uses `usePermissions().can(...)` (built on `createCan`) to hide UI.

```ts
// server
const { authorized } = await authorize({ permissions: ["user:delete"] });
if (!authorized) return unauthorizedResponse();

// client
const { can } = usePermissions();
{can("user:delete") && <DeleteButton />}
```

### 🧠 Permission Utilities

Reusable helpers across frontend & backend:

```ts
can(permissions, perm)
canAny(permissions, perms[])
canAll(permissions, perms[])
```

✔ Used in:

* Middleware
* API routes
* UI rendering

---

## 🗄️ Database (Prisma + PostgreSQL)

### Core Models:

* `User`
* `Role`
* `Permission`
* `RolePermission` (join table)
* `AuditLog` (for tracking actions)

---

## 📊 Audit Logging System

Tracks all critical actions:

### Examples:

* User deletion
* Admin assignment
* Product removal

### Stored Data:

* `userId`
* `action`
* `entity`
* `entityId`
* `metadata (JSON)`
* `createdAt`

---

## 🛠️ Admin Panel (In Progress)

### Current Features:

* User management UI
* Role management UI
* Audit logs viewer

### Planned Features:

* Assign/remove permissions from roles
* Promote/demote users (admin, store_manager)
* Product management system
* Permission matrix UI (checkbox-based)

---

## 🧭 Routing & Middleware

### Protected Routes:

* `/admin/*` → requires `admin:access`
* `/profile`, `/cart`, `/dashboard` → requires `user:access` (any authenticated user)
* Unauthenticated users are redirected to `/signin`

### Smart Redirects:

* Logged-in users are redirected based on `admin:access`
* Unauthorized access blocked at middleware level
* **Server actions and API routes re-check permissions** (middleware is UX only)

---

## 🔑 First Admin Bootstrap

There is no UI to create the first admin (that would be a chicken-and-egg
problem). Use the seed script with env vars instead:

```bash
ADMIN_EMAIL=admin@chaatwala.com ADMIN_PASSWORD=strongpassword npx prisma db seed
```

* If a user with `ADMIN_EMAIL` already exists, they are promoted to `admin`.
* Otherwise a new credentials-based admin user is created.
* All other users default to the `user` role (assigned on first sign-in / seed).

---

## 🎨 Frontend

* Built with **Next.js App Router**
* Role-aware UI rendering
* Permission-based component visibility

Example:

```tsx
{can("food:delete") && <DeleteButton />}
```

---

## ⚠️ Current Issues / TODO

### 🟡 In Progress
* Full CRUD APIs for food/orders with permission checks (`food:*`, `order:create`)
* Audit log filters & UI improvements
* Revoke-self / last-admin safeguards in UI

---

## 🧱 Tech Stack

* **Frontend:** Next.js (App Router), React
* **Backend:** Next.js API routes
* **Auth:** NextAuth (JWT)
* **ORM:** Prisma
* **Database:** PostgreSQL
* **Linting:** ESLint

---

## 🔒 Security Practices

* ✅ Backend permission validation (critical)
* ✅ Middleware route protection
* ✅ Frontend UI guards (non-trusted layer)
* ✅ Audit logging for sensitive actions

---

## 🚀 Future Roadmap

* Multi-tenant support (SaaS scaling)
* Advanced permission editor UI
* Real-time updates (WebSockets)
* Analytics dashboard
* Payment integration

---

## 🧠 Key Learnings / Highlights

* Transitioned from **role-based → permission-based system**
* Implemented **enterprise-level RBAC**
* Designed **scalable and extensible auth architecture**
* Introduced **audit logging for accountability**

---

## 🧑‍💻 Author

Built with focus on **clean architecture, scalability, and real-world SaaS patterns**.

---

## 📌 Status

> ⚙️ **Actively in development — core RBAC system implemented, admin features expanding**

---
