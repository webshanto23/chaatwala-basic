# 🍽️ Chaatwala — SaaS Food Ordering & Admin Platform

## 🚀 Project Overview

**Chaatwala** is a modern SaaS-based food ordering platform built with **Next.js, Prisma, PostgreSQL, and NextAuth**, featuring a **production-grade RBAC (Role-Based Access Control) system**.

The project is designed to support both **customer-facing features** and a powerful **admin dashboard** with granular permission control.

---

## 🧠 Current Architecture

### 🔐 Authentication & Authorization

- **NextAuth (JWT-based) authentication**
- **Database-driven RBAC system**
- Dynamic **roles & permissions**
- Centralized **permission helpers (`can()`)**
- Middleware-based route protection
- Backend API-level authorization (secure)

---

### 🧩 RBAC System (Core Feature)

#### Roles

- `user`
- `admin`
- `store_manager` (future)

## 🗄️ Database (Prisma + PostgreSQL)

## 📊 Audit Logging System

## 🛠️ Admin Panel

### Current Features:

- User management UI
- Role management UI
- Audit logs viewer

### Planned Features:

- Assign/remove permissions from roles
- Promote/demote users (admin, store_manager)
- Product management system
- Permission matrix UI (checkbox-based)

## 🧭 Routing & Middleware

### Protected Routes:

- Unauthenticated users are redirected to `/signin`

### Smart Redirects:

- Logged-in users are redirected based on `access`
- Unauthorized access blocked at middleware level
- **Server actions and API routes re-check permissions** (middleware is UX only)

## 🎨 Frontend

- Built with **Next.js App Router**
- Role-aware UI rendering
- Permission-based component visibility

## ⚠️ Current Issues / TODO

### 🟡 In Progress

- Full CRUD APIs for food/orders with permission checks (`food:*`, `order:create`)
- Audit log filters & UI improvements
- Revoke-self / last-admin safeguards in UI

## 🧱 Tech Stack

- **Frontend:** Next.js (App Router), React
- **Backend:** Next.js API routes
- **Auth:** NextAuth (JWT)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Linting:** ESLint

## 🔒 Security Practices

- ✅ Backend permission validation
- ✅ Middleware route protection
- ✅ Frontend UI guards
- ✅ Audit logging for sensitive actions

## 🚀 Future Roadmap

- Multi-tenant support (SaaS scaling)
- Advanced permission editor UI
- Real-time updates (WebSockets)
- Analytics dashboard
- Payment integration

## 🧠 Key Learnings / Highlights

- Transitioned from **role-based → permission-based system**
- Implemented **enterprise-level RBAC**
- Designed **scalable and extensible auth architecture**
- Introduced **audit logging for accountability**

## 🧑‍💻 Author

Built with focus on **clean architecture, scalability, and real-world SaaS patterns**.

## 📌 Status

> ⚙️ **Actively in development — core RBAC system implemented, admin features expanding**

---
