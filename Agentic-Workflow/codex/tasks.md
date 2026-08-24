# Implement Admin-Managed Homepage Hero Image

You are working on the **Chaatwala** production codebase.

Implement a production-ready system where the **homepage Hero Section image can ONLY be uploaded/replaced by an authorized ADMIN from the Admin Dashboard**.

Do not blindly implement based on assumptions. First inspect the existing codebase, database schema, authentication/RBAC implementation, image-upload system, homepage Hero component, admin architecture, caching/revalidation strategy, and existing tests. Reuse the existing patterns wherever possible.

The project already has ongoing architecture/security/performance work, so **do not introduce a parallel architecture or duplicate functionality**.

---

## 1. First: Audit the Existing Implementation

Before changing anything, inspect:

- Homepage route and Hero component
- Existing admin routes/layout
- Existing admin permission/RBAC system
- Existing `ADMIN`, `STORE_MANAGER`, and `USER` authorization rules
- Existing image upload implementation
- Existing ImageBB integration, if still present
- Existing image compression/optimization utilities
- Existing Prisma schema
- Existing settings/configuration models
- Existing server actions
- Existing API routes
- Existing cache/revalidation utilities
- Existing tests
- Existing `SiteSetting`, `Settings`, `Hero`, `Banner`, or equivalent models/components if any

Search the entire repository before creating new files.

### Important

Do NOT create a second image-upload mechanism if the project already has a reusable upload service.

Do NOT create duplicate authentication or permission logic.

Do NOT move unrelated code.

Do NOT modify the existing homepage design unnecessarily.

---

# 2. Functional Requirement

The homepage currently contains a Hero Section with a large visual image.

That image must become **admin-managed**.

The final flow should be:

```text
ADMIN DASHBOARD
      ↓
Hero Settings
      ↓
Upload / Replace Hero Image
      ↓
Existing Image Upload / Storage Service
      ↓
Database
      ↓
Homepage Server Component
      ↓
Hero Image
```

Regular users must never be able to modify the Hero image.

Store managers must also NOT be able to modify it unless the existing permission system explicitly defines them as having this capability.

For this feature, the default required role is:

```text
ADMIN
```

---

# 3. Database Design

Inspect the existing schema first.

If there is already a suitable global/site settings model, reuse it.

If there is no suitable model, create a minimal settings model rather than creating an unnecessary `HeroImages` table.

Prefer a singleton/global settings record.

Possible fields:

```text
heroImageUrl
heroImageAlt
imageDeleteUrl / imageDeleteKey
updatedBy
updatedAt
```

Use the project's existing naming conventions.

Do not blindly copy the above schema if the existing database architecture has a better equivalent.

### Important

There should normally be **one current Hero image**, not an ever-growing collection of Hero records.

If the existing image storage system provides a deletion URL/key, retain it so the previous image can be cleaned up safely after a successful replacement.

---

# 4. Admin UI

Add Hero management to the existing Admin Dashboard using the project's current admin navigation and UI conventions.

Prefer a route such as:

```text
/admin/settings/hero
```

but first inspect the current admin structure and use the existing appropriate location if one already exists.

The UI should provide:

### Current Hero Image

- Current image preview
- Upload/replace control
- Image validation feedback
- Upload progress/loading state if supported by the existing architecture
- Save/update action
- Alt text field
- Success/error feedback

Example conceptual UI:

```text
Hero Section
────────────────────────────────

Current Hero Image

[ image preview ]

[ Replace Image ]

Alt Text
[ Chaatwala street food ]

[ Save Changes ]
```

Use the existing shadcn/UI/Tailwind components and styling conventions.

Do not redesign the entire Admin Dashboard.

---

# 5. Image Upload

Reuse the existing project image pipeline.

If the project currently uses:

- ImageBB
- Sharp
- an existing `uploadImage()` helper
- an existing image service
- an existing delete-image mechanism

then integrate with that implementation.

Do not create a second upload abstraction unless the existing one genuinely cannot support this use case.

Validate:

- MIME type
- file extension where appropriate
- maximum file size
- successful upload response
- valid returned URL

Use the project's existing image compression rules if available.

If Sharp/compression is already used, preserve that pipeline.

---

# 6. Safe Image Replacement

The replacement process must be safe.

Correct sequence:

```text
Validate new image
      ↓
Upload new image
      ↓
Confirm successful upload
      ↓
Update database
      ↓
Revalidate homepage
      ↓
Delete old image
```

Do NOT delete the old image before the new image has successfully uploaded and the database has successfully updated.

If the new upload fails:

```text
Old image remains active
```

If the database update fails:

```text
Do not remove the old image
```

Avoid leaving the homepage without a valid Hero image.

Handle cleanup failures safely and log them appropriately according to the project's existing logging strategy.

---

# 7. Authorization — CRITICAL

Authorization must be enforced **server-side**.

Do NOT rely on:

- hiding the Admin UI
- frontend route protection alone
- client-side role checks
- disabled buttons
- middleware alone

The server action/API responsible for changing the Hero image must independently verify:

```text
Authenticated user?
        ↓
ADMIN?
        ↓
Allowed to modify Hero?
        ↓
Perform mutation
```

Expected behavior:

```text
Unauthenticated → 401 / existing equivalent
Authenticated non-admin → 403 / existing equivalent
ADMIN → allowed
```

Use the project's existing authorization/permission utilities.

Do not create another independent RBAC implementation.

This is especially important because the project has already undergone permission/security auditing.

---

# 8. Homepage Rendering

The homepage should remain **server-driven**.

Do NOT implement:

```tsx
useEffect(() => {
  fetch("/api/hero");
}, []);
```

Do NOT add a client-side request just to retrieve the Hero image.

Do NOT create an API round trip from the homepage to retrieve data that can already be queried directly on the server.

Follow the project's existing architecture:

```text
app/
    routing + server rendering

features/
    business logic/data access

components/
    presentation

lib/
    shared infrastructure
```

If the Hero is currently a Client Component, keep it client-side only if genuinely necessary. Otherwise make the data retrieval happen in the Server Component and pass the image URL into the presentation component.

Conceptually:

```tsx
const settings = await getSiteSettings();

return (
  <Hero imageUrl={settings.heroImageUrl} imageAlt={settings.heroImageAlt} />
);
```

Adapt this to the actual project architecture.

---

# 9. Performance / Request-Reduction Requirement

The project has previously suffered from excessive client-side fetching and request duplication.

Therefore:

### DO

- fetch Hero settings on the server
- reuse existing cached data functions
- use React `cache()` if appropriate
- use Next.js revalidation if appropriate
- revalidate only when the Hero changes

### DO NOT

- fetch Hero data in `useEffect`
- create unnecessary REST calls
- fetch the same settings multiple times from separate components
- introduce React Query/SWR solely for this feature
- add polling
- add unnecessary client state

The goal is:

```text
Homepage
    ↓
Server-side settings retrieval
    ↓
Hero
```

not:

```text
Homepage
    ↓
Client JS
    ↓
API
    ↓
Database
    ↓
Hero
```

---

# 10. Cache / Revalidation

Inspect the existing caching strategy.

When an ADMIN successfully updates the Hero image, invalidate the relevant homepage cache using the project's existing strategy.

For example, if appropriate:

```ts
revalidatePath("/");
```

If the project already uses tagged caching, use the existing tag instead.

Do not introduce a second caching strategy.

The new image should become visible on the homepage after the successful admin update without requiring unnecessary application-wide cache invalidation.

---

# 11. Hero Image Fallback

The homepage must not break if:

- no Hero image exists
- database value is null
- an old record is missing
- an upload is temporarily unavailable

Implement a sensible fallback using the project's existing asset strategy.

However, do NOT hard-code the uploaded screenshot as a permanent database-independent replacement if the requirement is for the image to be admin-managed.

The fallback should be clearly treated as a fallback.

---

# 12. Admin dashbaord

There is a Home: /home route in admin sidebar that renders the homepage in public view. create a page with existing page layout and colors that renders the homepage settings page. change the route to /admin/homepage
place the hero Image upload system there.

# 13. Image Optimization

Because the Hero image is likely an LCP candidate, inspect the existing Next.js image implementation.

Use the project's existing image optimization approach.

If appropriate:

- `next/image`
- correct responsive sizing
- correct `sizes`
- appropriate dimensions/aspect ratio
- priority/preload behavior only if the Hero is actually the LCP image
- avoid layout shift
- avoid unnecessarily huge source images

Do not blindly add `priority` everywhere.

The Hero image should have stable dimensions/aspect ratio to avoid CLS.

---

# 14. Validation

Add validation for:

### File

- accepted image types
- maximum file size
- malformed upload
- empty file
- invalid upload response

### Authorization

Test:

```text
Unauthenticated
Non-admin
Store manager
Admin
```

### Mutation

Test:

```text
Successful upload
Upload failure
Database update failure
Old-image cleanup failure
```

### Rendering

Test:

```text
Hero exists
Hero missing
Hero replaced
Fallback behavior
```

---

# 15. Tests

Inspect the existing test framework first.

The project currently has an established testing setup, so use the existing framework and conventions.

Add focused tests rather than creating a new test framework.

At minimum cover:

```text
✓ ADMIN can update Hero image
✓ USER cannot update Hero image
✓ STORE_MANAGER cannot update Hero image
✓ unauthenticated user cannot update Hero image
✓ invalid image is rejected
✓ failed upload does not destroy existing Hero
✓ homepage uses stored Hero image
✓ homepage fallback works when no image exists
✓ successful update triggers required cache/path revalidation
```

Do not break existing tests.

---

# 16. Migration / Seed

If a new database model or field is required:

- create the proper Prisma migration
- update Prisma client usage
- follow existing migration conventions
- create/initialize the singleton settings record if necessary

Do not manually edit the production database.

If the project uses a seed mechanism for global settings, integrate with it appropriately.

---

# 17. Security Review After Implementation

After implementation, explicitly inspect the mutation endpoint/server action for:

- IDOR
- missing authentication
- missing role verification
- unauthorized file replacement
- unsafe file types
- oversized uploads
- malicious filenames
- leaking storage credentials
- client-controlled `updatedBy`
- client-controlled ownership
- bypassing the Admin UI

Never trust `userId`, `role`, or permission information supplied by the browser.

Use the authenticated server-side identity.

---

# 18. Do Not Over-Engineer

This is an admin-managed Hero image, not a full CMS.

Do NOT add:

- version history
- image galleries
- scheduled banners
- drag-and-drop page builders
- multiple Hero campaigns
- Redis
- a new API layer
- a new state management library
- microservices

unless the existing project already requires them.

Keep the implementation small, secure, testable, and consistent with the current Chaatwala architecture.

---

# 19. Required Workflow

Follow this workflow exactly:

### Phase 1 — Inspect

Analyze the existing codebase and identify:

- current homepage Hero implementation
- current admin structure
- current RBAC
- current image upload service
- current database settings structure
- current caching/revalidation
- current testing patterns

### Phase 2 — Plan

Before editing, produce a short implementation plan listing:

```text
Files to create
Files to modify
Files to delete, if any
Database changes
Authorization changes
Tests to add
```

Do not modify unrelated files.

### Phase 3 — Implement

Implement the feature using existing project patterns.

### Phase 4 — Validate

Run the relevant:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use the project's actual scripts from `package.json`; do not assume these exact commands exist.

### Phase 5 — Review

Inspect the git diff.

Look specifically for:

- unnecessary changes
- duplicated logic
- security bypasses
- client-side fetching
- accidental permission expansion
- broken routes
- broken existing functionality

### Phase 6 — Report

At the end, report:

```text
IMPLEMENTED
- ...

FILES CHANGED
- ...

DATABASE
- ...

AUTHORIZATION
- ...

IMAGE STORAGE
- ...

CACHE/REVALIDATION
- ...

TESTS
- ...

VALIDATION
- ...

REMAINING ISSUES
- ...
```

If something could not be safely implemented because the existing codebase differs from the expected architecture, stop and explain the exact issue rather than inventing an implementation.

---

# Final Acceptance Criteria

The feature is complete only when all of these are true:

- [ ] Hero image is controlled from Admin Dashboard
- [ ] Only ADMIN can modify it
- [ ] Server-side authorization is enforced
- [ ] Existing image-upload infrastructure is reused
- [ ] Image is stored persistently
- [ ] Homepage reads the stored image server-side
- [ ] No unnecessary client-side Hero fetch exists
- [ ] Homepage cache/revalidation works after replacement
- [ ] Old image is safely cleaned up when appropriate
- [ ] Existing image remains intact if replacement fails
- [ ] Hero has a safe fallback
- [ ] Hero image is optimized for LCP/CLS
- [ ] Existing homepage design is preserved
- [ ] Tests cover authorization and mutation behavior
- [ ] Existing tests remain passing
- [ ] TypeScript/lint/build validation passes
- [ ] No unrelated architectural refactor is introduced

**Important: Inspect first, then implement. Do not guess the current architecture.**
