# Chaatwala Release Checklist

## Before merge

### Source
- [ ] Clean git status reviewed.
- [ ] Diff reviewed.
- [ ] No secrets committed.
- [ ] No debug endpoints/logging left enabled.

### Auth/security
- [ ] Anonymous access tested.
- [ ] User access tested.
- [ ] Admin access tested.
- [ ] Store-manager access tested.
- [ ] Wrong-role access returns access denied/403 as designed.
- [ ] API endpoints tested independently of UI.

### Cart/checkout
- [ ] Sign in.
- [ ] Add product.
- [ ] Select store.
- [ ] Add/select address.
- [ ] Confirm checkout enabled.
- [ ] Refresh.
- [ ] Verify user/session/cart/store/address state.
- [ ] Continue checkout.
- [ ] Test logout/login.
- [ ] Test wrong-role access.

### Build
- [ ] Unit/integration tests.
- [ ] TypeScript.
- [ ] Lint.
- [ ] Production build.

### Performance
- [ ] Inspect browser Network tab.
- [ ] Confirm admin/store-manager do not request cart/search.
- [ ] Confirm no repeated `/api/user/me` calls.
- [ ] Confirm no search-per-keystroke behavior.
- [ ] Check bundle changes.

### Deployment
- [ ] Environment variables verified.
- [ ] Database migration strategy verified.
- [ ] Payment callback URLs verified for the target environment.
- [ ] Image storage/provider configuration verified.
- [ ] Production domain/SSL verified.
- [ ] Rollback plan available.
