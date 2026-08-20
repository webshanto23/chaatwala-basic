# Chaatwala Code Review Checklist

## Architecture
- [ ] Route belongs to the correct route group.
- [ ] Correct layout owns the shell.
- [ ] CartProvider exists only where needed.
- [ ] Admin/store-manager do not inherit customer UI.
- [ ] No duplicate route/layout ownership.

## Authentication
- [ ] Session is read server-side where required.
- [ ] Anonymous users cannot access protected server resources.
- [ ] Session hydration does not create visible auth-state flashes.
- [ ] Refresh preserves session state.

## Authorization
- [ ] Role is read from `session.user.role`.
- [ ] Permissions are capability checks only.
- [ ] Resource ownership/store scope is checked.
- [ ] API authorization exists independently of UI authorization.

## Redirects
- [ ] One redirect owner per route boundary.
- [ ] No proxy → home → role dashboard chain unless intentional.
- [ ] No role ping-pong.
- [ ] Access denied terminates safely.

## Cart/checkout
- [ ] Cart survives refresh when it should.
- [ ] Store selection survives refresh.
- [ ] Address selection survives refresh.
- [ ] Checkout state is reconstructed from server/session/cart state.
- [ ] Cart item mutation verifies ownership.

## Session/UI
- [ ] Navbar does not briefly show Sign In for authenticated users.
- [ ] User state is available before dependent UI renders.
- [ ] Client providers do not duplicate server data unnecessarily.

## Performance
- [ ] No unnecessary API request on mount.
- [ ] No search request per keystroke.
- [ ] Repeated reads are cached appropriately.
- [ ] DB query count was measured.
- [ ] Client bundle impact considered.

## Security
- [ ] Mutating APIs authenticate.
- [ ] Sensitive APIs authorize.
- [ ] Uploads are protected and constrained.
- [ ] Payment callbacks are provider-authenticated and idempotent.
- [ ] Input is validated server-side.

## Quality
- [ ] No unrelated changes.
- [ ] `git diff --check` passes.
- [ ] Tests pass.
- [ ] Typecheck passes.
- [ ] Build passes when appropriate.
