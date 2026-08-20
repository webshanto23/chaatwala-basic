# Chaatwala Agentic Development Workflow

## Phase 1 — Understand

Codex must inspect:
- `package.json`
- route tree
- relevant layouts
- auth/session helpers
- relevant feature service/actions
- Prisma schema when data is involved
- tests
- existing audit documents

Do not modify during discovery.

## Phase 2 — Plan

Write:

```text
Goal:
Current behavior:
Root cause:
Files likely involved:
Security impact:
Performance impact:
Implementation plan:
Validation plan:
```

If the plan crosses multiple domains, split the task.

## Phase 3 — Implement

Rules:
- smallest safe diff,
- preserve public URLs,
- preserve role boundaries,
- preserve API contracts unless explicitly changing them,
- reuse existing helpers,
- do not duplicate auth logic unnecessarily.

## Phase 4 — Validate

Use the smallest relevant checks first:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Use only commands that exist in `package.json`.

For security tasks, also perform direct HTTP/API tests.

## Phase 5 — Review

Inspect:

```bash
git diff --check
git diff --stat
git diff
```

Then ask:

- Did the fix actually enforce server-side authorization?
- Did any route become public accidentally?
- Did any redirect owner multiply?
- Did a provider move to the wrong layout?
- Did DB/API request count increase?
- Did unrelated files change?

## Phase 6 — Commit

Use focused commits.

Examples:

```text
fix(auth): enforce store manager role boundary
fix(cart): enforce cart item ownership
fix(payment): secure payment validation callback
perf(products): cache related products
refactor(auth): centralize role enforcement
```

Do not mix security fixes with cosmetic UI changes.

## Agent handoff format

At the end:

```text
Completed:
- ...

Files changed:
- ...

Validation:
- ...

Known limitations:
- ...

Next recommended task:
- ...
```
