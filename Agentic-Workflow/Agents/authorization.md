# Chaatwala Authorization Model

## Role hierarchy

Roles are identity, not permissions:

```text
user
admin
store_manager
```

Do not determine a role with:

```ts
permissions.includes("admin:access")
permissions.includes("store:view")
```

Use:

```ts
session.user.role
```

## Capability model

Permissions answer:

> What may this already-authorized actor do?

Examples:

```text
food:view
food:create
food:update
food:delete

order:create
order:view
order:update

store:view
store:create
store:update
store:delete

user:view
user:updateRole
user:delete

audit:view
role:manage
```

## Recommended distinction

### Role
Who is the actor?

### Permission
What capability does the actor have?

### Ownership/scope
Which resource may the actor operate on?

Example:

```text
store_manager
  + order:update
  + managedStore = Store A
  → may update orders belonging to Store A
```

Having `order:update` alone must not grant access to every store's orders.

## Route enforcement

Preferred pattern:

```text
request
  ↓
auth()
  ↓
role check
  ↓
managed-store / ownership check
  ↓
render
```

For APIs:

```text
auth()
  ↓
requireRole(...)
  ↓
requirePermission(...)
  ↓
resource ownership/scope
  ↓
validation
  ↓
mutation
```

## Redirect ownership

Keep one authoritative redirect owner per route boundary.

Avoid:
- proxy redirects authenticated users to `/`,
- page redirects them to role dashboard,
- layout redirects again.

This creates unnecessary chains and can create loops when state hydration differs.

## Permissions cleanup

Legacy role-marker permissions such as `admin:access`, `store:view`, and `user:access` should not be used to infer roles.

Do not delete database permissions blindly. First search for all checks, seeds, admin UI usage, tests and migration dependencies.

## Security rule

A hidden button is not authorization.

A client-side permission check is not authorization.

The server must reject unauthorized requests.
