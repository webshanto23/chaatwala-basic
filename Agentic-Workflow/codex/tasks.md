# Architecture Evolution Plan — Customer, Staff, and RBAC

Status: planning only. Do not implement until the architecture decisions are finalized.

## Decisions made

- Keep one role per user.
- Keep two application layouts: a customer layout and a staff layout. Auth remains a minimal third boundary, not a dashboard application.
- Separate application areas by workspace, not by every individual role:
  - `customer`: storefront, cart, checkout, payments, addresses, customer orders/profile.
  - `staff`: all operational tools for admin, store manager, super admin, and future staff roles.
- Keep customer, staff, and auth route shells isolated. The root layout must contain global-only infrastructure.
- Use permissions for capabilities inside a workspace. Keep role/workspace identity separate from permissions and keep store/data scope separate from both.
- Use a single canonical `/staff/*` workspace with permission-filtered, code-owned navigation. Do not implement database-configured arbitrary menu URLs.
- This is a development-phase clean break: remove legacy `/admin/*` and `/store-manager/*` routes after their capabilities move to `/staff/*`; do not add redirects.
- Add a protected `super_admin` staff role. Only Super Admin manages direct staff creation, roles, role permissions, store assignments, and other control-plane operations.
- Public credential registration and OAuth create customer accounts only. Super Admin creates staff accounts directly with username/password credentials.
- Do not silently promote/convert a customer into staff. Reject staff creation when an identity conflicts with an existing customer account in v1.
- Keep all authorization server-side for pages, server actions, and APIs. Navigation visibility is never a security control.
- Start staff roles fresh: seed only the protected `super_admin` system role; Super Admin creates all ordinary staff roles and staff users. Keep a seeded customer role for public customer registration.

## Target route/provider topology

```text
src/app/
├─ layout.tsx                       global providers only
├─ (customer)/                      customer-only application shell
│  ├─ (public)/                     storefront/public content
│  ├─ (protected)/                  cart, checkout, orders
│  ├─ (user)/                       profile, addresses
│  └─ checkout/                     payment result routes
├─ (staff)/staff/*                  unified staff workspace
│  ├─ dashboard
│  ├─ catalog/products
│  ├─ stores
│  ├─ operations/orders
│  ├─ operations/inventory
│  ├─ content/homepage
│  ├─ content/about
│  ├─ access/staff
│  ├─ access/roles
│  ├─ access/permissions
│  ├─ audit
│  └─ settings
└─ (auth)/                          customer registration/sign-in and staff sign-in
```

- Customer layout owns `AppShell`, `CartProvider`, customer data, customer search, and floating cart.
- Staff layout owns only the staff shell, permission-filtered navigation, and staff-specific state.
- Auth layout mounts neither customer nor staff UI.
- Staff routes must never mount cart, checkout, payment, customer-address, customer-profile, or customer-search providers/components.
- Routes represent stable business capabilities, never individual roles. Adding a role must not create a new route tree, shell, or sidebar implementation.
- Route folders contain only a server guard, server data composition, and a feature-screen import. Place screens, actions, queries, types, and business components in their owning `src/features/<feature>/` module.

## RBAC and session design

- Add a `workspace` classification to roles: `customer` or `staff`, plus immutable system-role metadata for protected roles.
- Use `roleId` as the internal foreign-key and authorization identity. A role's human-readable `name` is a display label; use a protected immutable system key only where code must recognize `super_admin`.
- Session/JWT contains `user.id`, role ID, role name, workspace, permissions, and `sessionVersion`.
- Role and permission changes increment affected users’ `sessionVersion` so claims refresh on the next request.
- Replace fixed role-name branches for general routing with workspace-based routing:
  - customer → customer home/profile;
  - staff → `/staff`.
- Keep code-owned permission constants/catalogue; roles in the database receive assignments from that approved catalogue. Remove the fixed `RoleName` union and static role-to-permission mapping as runtime authority.
- Render staff menu items and dashboard cards from a code registry containing safe path, label, icon, section, and required permissions.
- Each staff page has a server guard for workspace plus capability. Each mutation/API additionally validates ownership or store scope.
- Store scope is not a permission: use a staff-to-store access join model that supports multiple stores and an optional primary store; resolve those assignments server-side in every store-scoped query/mutation. Global store access requires an explicit capability.

## Super Admin and direct staff provisioning

- Seed/bootstrap the first Super Admin only through controlled configuration or deployment setup; never through public registration.
- Protect Super Admin from deletion, self-demotion, self-role-editing, and removal of the final active Super Admin.
- Keep one shared `User` model, but add a nullable globally-unique staff `username`, nullable unique contact/recovery `email`, and active/disabled account state. Customer registration still requires email.
- Super Admin creates a staff account directly with name, unique username, password, staff role, optional contact email, and optional store scope. The selected role must belong to the staff workspace.
- Hash staff passwords with bcrypt. Super Admin cannot read them after creation; the initial password remains valid until the staff member or Super Admin changes it.
- Add a dedicated `/staff/sign-in` username/password route. Keep `/sign-in` email/password plus OAuth for customers only. Each sign-in path rejects the other workspace.
- Public OAuth must not create, convert, or sign in staff accounts through a customer flow.
- Super Admin resets staff passwords directly, increments `sessionVersion`, and creates an audit record. Contact email is optional and not required for staff recovery in v1.
- Staff can change their own password from staff settings by supplying the current password; this also increments `sessionVersion` and is audited.
- Remove ordinary customer-role assignment from the general Users screen. Customer management remains separate from staff provisioning.
- Audit staff creation, disable/enable, password reset, role changes, permission changes, store assignment, and Super Admin actions.

## Customer/staff isolation and performance

- The cart issue is caused by customer-shell ownership: `AppShell` currently always mounts `CartProvider`, and the provider uses role-specific client cleanup. The target is provider isolation, not more pathname/role conditions.
- Customer cart, checkout, payment, address, and customer-order API routes must reject authenticated staff sessions; guest cart behavior remains explicitly supported only where intended.
- Staff pages must make no `/api/cart`, customer profile, customer search, checkout, or payment requests.
- Avoid root-level database-backed session work for public rendering when the provider strategy permits; resolve/reuse session at protected boundaries.
- Use JWT claims for navigation so staff page rendering does not query roles/menus per request.
- Keep read-heavy public data behind existing cache tags; keep authorization and ownership checks fresh. Use connection pooling, indexes, and measurement before scale-driven changes.

## Migration phases

1. Add role workspace/system metadata, backfill the seeded customer role, seed protected `super_admin`, add staff username/optional contact email/active state, and replace the one-manager/one-store relation with multi-store staff access plus optional primary store.
2. Extend NextAuth session/JWT and authorization helpers with workspace-aware checks, session invalidation, and safe workspace home redirects.
3. Build `/staff` layout, permission registry, permission-filtered sidebar, and adaptive staff dashboard.
4. Migrate existing admin/store-manager capabilities incrementally to canonical staff routes, retaining current server authorization and store-scope checks.
5. Remove legacy admin/store-manager routes only after each canonical staff route is ready; do not leave redirect routes.
6. Build Super Admin-only direct staff creation, disable/enable, password reset, role, permission, and store-assignment control-plane workflows.
7. Move customer-only providers fully inside customer route boundaries; remove role-based cart hiding/clearing and enforce customer-workspace API access.
8. Measure and optimize: public-route caching, protected-route session queries, browser request counts, bundle size, Prisma query count, and database connection usage.

## Required validation

- Customer accounts cannot access `/staff`; staff accounts cannot access customer-only protected routes or APIs.
- Customer and staff sign-in reject the other workspace; staff authentication uses unique username/password only.
- Staff creation validates normalized username uniqueness, bcrypt hashing, active state, staff workspace role, and optional contact-email uniqueness.
- Existing customer identities cannot be created as staff in v1.
- Only Super Admin can create/disable/enable staff, reset staff passwords, create staff roles, modify role permissions, or assign staff scope.
- No removal/demotion of the final Super Admin; all control-plane actions are audited.
- Staff navigation/dashboard renders only authorized entries; direct page/action/API requests without permission are denied.
- Store-scoped staff users cannot read or mutate a different store’s resources.
- Multi-store staff can access only assigned stores; global store access requires its explicit capability.
- Staff self-service password changes require the current password, invalidate stale session claims, and create an audit record.
- Role/permission changes refresh JWT claims through `sessionVersion`.
- Legacy `/admin/*` and `/store-manager/*` route trees are removed after staff migration.
- Admin/store/staff browser sessions have zero cart, checkout, payment, customer profile, or customer search requests and do not load customer-commerce UI.

## Unified Food Catalog decision

- Replace the separate `Dish`, `Drink`, and `Combo` models with one database-backed `Food` catalog. This is a development-phase clean break; legacy product tables, actions, static combo data, and old product-specific UI may be removed when their replacements are ready.
- Staff manages foods, categories, and tags through the staff workspace. Customers only see filtered catalog results and use cart, checkout, and payment flows.
- `FoodCategory` is staff-managed browse/filter taxonomy (for example: dish, drink, dessert, snack). A food may have multiple categories.
- `FoodTag` is staff-managed labeling taxonomy (for example: popular, new, spicy). A food may have multiple tags.
- Keep `FoodKind` code-owned, not staff-configurable: `STANDARD` or `COMBO`. It represents stable business behavior rather than a customer-facing category.
- Every food has a staff-managed percentage discount, constrained to 0–100. Standard-food final price is its base price less its percentage discount.
- A combo is a `Food` with `FoodKind.COMBO` and 2–3 `FoodBundleItem` component rows. Staff selects component foods; components cannot be duplicated and circular combos are rejected.
- Combo base price is calculated server-side from the current final prices of its component foods. The combo's own percentage discount is then applied. Staff does not directly enter a combo base price.
- Cart and order records snapshot the final calculated price at the time of addition/order creation; later price or discount changes never modify historic orders.
- A combo is unavailable if it is globally unavailable, any component is globally unavailable, or any component is unavailable at the selected store. Store availability is generic per-food data, replacing legacy product-type inventory records.
- Customer catalog pages remain globally filtered by `Food.isAvailable`; the existing checkout-store selection remains the final store-specific availability authority in this migration. A pre-catalog customer store selector is separate future work.
- Staff capabilities stay code-owned permissions: `food:view`, `food:create`, `food:update`, `food:delete`, plus `food-category:manage` and `food-tag:manage` for taxonomy maintenance. Roles receive these permissions from the database.
