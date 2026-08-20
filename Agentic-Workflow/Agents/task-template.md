# Codex Task Template

Copy this file into a task prompt and fill it in.

## Task

### Goal
[One precise outcome]

### Scope
[Files/routes/features that may be changed]

### Out of scope
[Things Codex must not touch]

### Current behavior
[Observed behavior]

### Expected behavior
[Exact expected behavior]

### Constraints
- Preserve existing URLs.
- Preserve existing public API contracts unless explicitly required.
- Server-side authorization is mandatory.
- Do not infer roles from permissions.
- Do not add unnecessary client fetching.
- Do not refactor unrelated code.

### Investigation required
Before editing:
- inspect relevant layouts,
- inspect auth/session helpers,
- inspect route/page,
- inspect API endpoints,
- inspect feature services/actions,
- inspect Prisma schema if applicable,
- inspect tests.

### Acceptance criteria
- [ ] Expected behavior works.
- [ ] Unauthorized behavior is rejected server-side.
- [ ] Existing authorized behavior remains functional.
- [ ] No redirect loop/chain introduced.
- [ ] No unnecessary DB/API request introduced.
- [ ] TypeScript/tests/build pass as applicable.

### Validation
Run the relevant existing commands from `package.json`.

### Final report
Return:
1. root cause,
2. files changed,
3. implementation summary,
4. tests/checks,
5. remaining risks.
