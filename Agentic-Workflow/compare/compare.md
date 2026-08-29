• The project directory is not currently mounted, so I can’t re-read its files. But I retain the RBAC architecture from
prior inspection.

## Core model

This project uses a menu-driven RBAC design:

User → Role → role_menus → user_menus → menus

- users.role_id assigns one role to each user.
- roles defines roles; role ID 1 is Super Admin.
- menus stores both navigation and permissions.
- role_menus assigns menu/permission records to a role.
- user_menus is a copied, per-user permission snapshot used at runtime.

## Menus are permissions

A single menus table represents three hierarchy levels:

MAIN_MENU SCM
└─ SUB_MENU Requisitions
├─ ACTIONS View SCM Requisitions
├─ ACTIONS Create SCM Requisition
├─ ACTIONS Approve SCM Requisition
└─ ACTIONS Allocate SCM Requisition Stock

Each entry has a stable menu_key, such as:

- MM_SCM — main SCM navigation
- SM_SCM_REQUISITIONS — Requisitions submenu
- A_APPROVE_SCM_REQUISITION — action permission

Only main/sub menus render in the sidebar. Action records are hidden permissions, assigned from the Roles screen.

## Authentication and runtime access

After login, middleware resolves the user and attaches runtime context to the request:

- logged-in user ID
- role ID
- selected/current store ID
- Super Admin flag
- allowed menu IDs/keys

The check_access([...]) helper is then used by controllers:

- Page controllers check the main + submenu keys.
- API endpoints check an action key.
- With the “return” option, it returns true/false for UI capability checks.
- Otherwise it blocks unauthorized access.

For example, SCM APIs check actions such as:

check_access(['A_ADD_SCM_REQUISITION'], true)
check_access(['A_APPROVE_SCM_REQUISITION'], true)

This is important: hiding a button is not security; the API also enforces the permission.

## Super Admin behavior

Role ID 1 bypasses normal menu/action permission checks. A Super Admin therefore sees all active menus and can perform
all actions without explicit role_menus rows.

Normal users must receive permission through their role.

## Permission update flow

When a Super Admin updates a role in the Roles screen:

1. The chosen menu/action IDs are saved to role_menus.
2. The application runs its user-role synchronization.
3. Permissions are copied into user_menus for users in that role.
4. On refresh/login, the sidebar and authorization checks use that effective user permission set.

That copied user_menus layer improves read speed, but creates a synchronization responsibility: role changes must
refresh affected users’ effective permissions.

## Store access is separate

RBAC answers: “May this user do this action?”

Store context answers: “Which store’s records may this action operate on?”

Most operational queries use logged_user_store_id. SCM is an exception where a requisition intentionally references
both:

- requester store, e.g. ST-01
- source store, e.g. MF-01

For another project, keep store/tenant scope separate from role permissions exactly like this.

## What to reuse in another project

The strongest reusable pattern is:

roles
permissions
role_permissions
user_effective_permissions (optional cached snapshot)

Use stable permission codes, not labels:

scm.requisition.view
scm.requisition.create
scm.requisition.approve
scm.requisition.allocate

Then enforce each permission twice:

- frontend: control visibility/usability;
- backend: authorize every protected route/action.

One improvement I would make in a new project: use a dedicated permissions table instead of treating navigation menus
as permissions. Then link menus to permissions optionally. That keeps authorization independent from sidebar design
while preserving this project’s practical workflow.
