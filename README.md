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
* `store_manager`
* `super_admin`

#### Permissions

Granular permissions like:

* `users:view`
* `users:delete`
* `admins:assign`
* `products:create`
* `products:delete`
* `dashboard:access`

#### Special Rule

* 👑 **Super Admin Override**

  * Automatically has `"*"` (all permissions)
  * Bypasses all checks

---

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
* `/profile`, `/cart` → requires `user:access`

### Smart Redirects:

* Logged-in users redirected based on permissions
* Unauthorized access blocked at middleware level

---

## 🎨 Frontend

* Built with **Next.js App Router**
* Role-aware UI rendering
* Permission-based component visibility

Example:

```tsx
{can("products:delete") && <DeleteButton />}
```

---

## ⚠️ Current Issues / TODO

### 🔴 Needs Fixing

* `useEffect` data fetching pattern (setState warning)
* Cleanup unused variables/imports

### 🟡 In Progress

* Admin permission assignment UI
* Full CRUD APIs with permission checks
* Audit log filters & UI improvements

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
