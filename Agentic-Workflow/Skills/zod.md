# Zod Skill

## Overview
Zod v4.4.3 used for runtime type validation and schema inference across the Chaatwala-Basic project.

## Core Concepts
- **Schemas**: Defined in `src/lib/validations/` for auth, address, dish, and drink inputs
- **Inference**: Types are inferred via `z.infer<typeof schema>`; used for Server Action and API route parameter typing
- **Parsing**: `.parse()` throws on failure; `.safeParse()` returns typed success/error result

## Project-Specific Patterns
- **Auth Schema**: `src/lib/validations/auth.ts` — `signInSchema` validates email/password for the Credentials provider
- **Address Schema**: `src/lib/validations/address.ts` — validates address creation/update inputs
- **Dish Schema**: `src/lib/validations/dish.ts` — validates dish creation/update inputs
- **Drink Schema**: `src/lib/validations/drink.ts` — validates drink creation/update inputs
- **Usage in Server Actions**: Call `.parse()` on validated input before database operations
- **Usage in API Routes**: Parse `request.formData()` or `request.json()` through schemas before processing

## Best Practices
- Define schemas close to where they are used (feature-level or shared in `src/lib/validations/`)
- Export inferred types alongside schemas for reuse in components and API contracts
- Use `.safeParse()` in API routes to return structured 400 errors
- Use `.parse()` in Server Actions where throwing is acceptable (Next.js will catch and return error)
- Chain refinements for cross-field validation (e.g., discount price < original price)
- Use `.transform()` to coerce inputs (e.g., string to number for price fields)

## Common Mistakes to Avoid
- **Missing validation**: Never trust client input; always validate before Prisma writes
- **Overly permissive schemas**: Avoid `.optional()` without defaults when the field is required for business logic
- **Schema duplication**: Reuse schemas across Server Actions and API routes for the same entity
- **Ignoring safeParse errors**: When using `.safeParse()`, always inspect `error.issues` and return meaningful messages
- **Zod v4 syntax**: Ensure compatibility with Zod v4 (e.g., `.brand()` for branding, `.pipe()` for transforms)
