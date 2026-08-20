# Chaatwala Current Architecture

## Route tree

```text
src/app/
├── layout.tsx
├── (customer)/
│   ├── layout.tsx
│   ├── (public)/
│   ├── (protected)/
│   ├── (user)/
│   └── checkout/
├── (admin)/
│   ├── layout.tsx
│   └── admin/
├── (auth)/
│   ├── layout.tsx
│   └── sign-in, sign-up, password/email flows
└── store-manager/
    ├── layout.tsx
    ├── dashboard/
    ├── store/
    ├── orders/
    ├── inventory/
    └── settings/
```

## Shell ownership

| Area | Shell | CartProvider |
|---|---|---|
| Customer | AppShell | Yes |
| Admin | AdminShell | No |
| Store manager | StoreManagerShell | No |
| Auth | AuthLayout/minimal | No |

## Root layout

The root layout should contain only truly global providers and UI infrastructure.

Do not place customer-only state there.

## Data-fetching model

Preferred:

```text
Server page/layout
      ↓
feature/service
      ↓
Prisma
      ↓
props
      ↓
client component for interaction
```

Avoid:

```text
Client component
      ↓
useEffect
      ↓
API
      ↓
same server data
```

unless client-side fetching is genuinely required.

## Authorization boundaries

- Route identity comes from URL/layout ownership.
- Role identity comes from `session.user.role`.
- Capability identity comes from permissions.
- Resource scope comes from ownership/store relationships.

These are separate concepts and must not be conflated.

## Performance context

Previous profiling found:
- admin/store-manager shell isolation is healthy,
- no N+1 pattern in store availability,
- related-products was uncached,
- search used multiple ILIKE queries,
- the previous Neon configuration used `connection_limit=1`, which serialized Prisma queries,
- homepage/product pages had a relatively large client JS payload.

These are historical measurements. Re-measure before changing architecture.
