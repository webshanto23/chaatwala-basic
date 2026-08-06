# Conventions

## Naming Conventions

### Files and Directories
- **Components**: PascalCase for React components (`ProductCard.tsx`, `Navbar.tsx`)
- **Utilities/Hooks/Context**: kebab-case (`use-can.ts`, `auth-context.tsx`, `utils.ts`)
- **Server Actions**: kebab-case for files, camelCase for functions (`actions.ts`, `getCartAction()`)
- **API Routes**: `route.ts` in lowercase directories (`src/app/api/cart/route.ts`)
- **Feature Modules**: lowercase directories (`src/features/cart/`, `src/features/products/`)
- **Validation Schemas**: kebab-case (`sign-in.ts`, `address.ts`)

### Variables and Functions
- **Variables**: camelCase (`guestId`, `deliveryFee`, `paymentStatus`)
- **Constants**: UPPER_SNAKE_CASE for environment-like constants (`GUEST_COOKIE`, `DELIVERY_FEE`)
- **Functions**: camelCase (`getOrCreateCart()`, `initiatePayment()`)
- **Types/Interfaces**: PascalCase (`Cart`, `Order`, `ProductType`)
- **Boolean Variables**: prefix with `is`, `has`, `can` (`isAvailable`, `hasPermission`, `canEdit`)

### Database
- **Prisma Models**: PascalCase (`User`, `Role`, `Dish`, `CartItem`)
- **Prisma Fields**: camelCase (`emailVerified`, `discountPrice`, `isDefault`)
- **Enums**: PascalCase (if used; currently string-based permissions)
- **Slugs**: kebab-case lowercase (`chicken-biryani`, `cold-coffee`)

## Component Structure Rules
- **Server Components**: Default; no `"use client"` directive
- **Client Components**: Must have `"use client"` at the top; only for interactivity
- **Prop Naming**: camelCase; use TypeScript interfaces or type aliases
- **Export Pattern**:
  - Default export for page-level components (`export default function Page() {}`)
  - Named exports for reusable components (`export function ProductCard() {}`)
- **File Organization**:
  - One component per file
  - Co-locate styles (Tailwind classes) in JSX; no CSS modules
  - Co-locate small sub-components in the same file; extract to separate files when reused

## Folder Naming Rules
- **Route Groups**: Parentheses `(admin)`, `(auth)`, `(public)`, `(user)` in `src/app/`
- **Feature Folders**: kebab-case lowercase (`src/features/cart/`, `src/features/product-actions/`)
- **Component Folders**: kebab-case lowercase (`src/components/shared/`, `src/components/admin/`)

## API Patterns
- **REST Routes**: `src/app/api/[resource]/route.ts` with named exports (`GET`, `POST`, `PATCH`, `DELETE`)
- **Dynamic Routes**: `[id]` segments with `params: Promise<{ id: string }>`
- **Server Actions**: `"use server"` at top of file; named exports
- **Response Shape**: JSON with consistent envelope:
  ```ts
  return NextResponse.json({ data, error: null }, { status: 200 });
  return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
  ```
- **Error Handling**: Use `unauthorizedResponse()` from `@/lib/authorize` for 403s; throw for 500s

## Schema Conventions
- **Primary Keys**: `id` (String, `@default(cuid())`) on all models
- **Timestamps**: `createdAt` and `updatedAt` with `@default(now())` and `@updatedAt`
- **Foreign Keys**: camelCase relation fields (`userId`, `roleId`, `cartId`)
- **Monetary Values**: `Decimal` type in Prisma; convert to `Number()` at API boundary
- **JSON Fields**: Use `Json` type for flexible metadata (e.g., `AuditLog.metadata`)
- **Unique Constraints**: Use `@@unique` for business keys (`email`, `slug`)
- **Indexes**: Add `@@index` for frequently queried non-unique fields

## Styling Rules
- **Utility-First**: Tailwind CSS v4 classes in JSX
- **Class Composition**: Always use `cn()` from `@/lib/utils`
- **Theme Tokens**: Use CSS variables (`text-primary`, `bg-secondary`, `border-accent`)
- **Responsive**: Mobile-first breakpoints (`sm:`, `md:`, `lg:`)
- **Dark Mode**: Use `.dark:` prefix with CSS variable-based colors
- **Animations**: Use `tw-animate-css` classes (e.g., `animate-fade-in`)
- **Spacing**: Use Tailwind's default spacing scale; avoid arbitrary values
- **Typography**: Use configured font tokens (`font-heading`, `font-body`, `text-display-lg`)

## Coding Standards
- **TypeScript**: Strict mode enabled (`"strict": true` in `tsconfig.json`)
- **No `any`**: Avoid `any` type; use `unknown` with type guards if necessary
- **Imports**: Use `@/` path aliases for all internal imports
- **Linting**: ESLint with `eslint-config-next`; run `npm run lint` before committing
- **Formatting**: Consistent indentation; follow existing code style
- **Comments**: Avoid comments; let code and types speak for themselves
- **Dead Code**: Remove unused imports, variables, and files (especially empty placeholders)
- **Console Logs**: Remove `console.log` before committing; use proper logging if needed

## Validation Rules
- **All Inputs**: Validate with Zod schemas before processing
- **Server Actions**: Validate at the top of the function before any side effects
- **API Routes**: Validate `request.formData()` or `request.json()` with schemas
- **Error Responses**: Return structured errors with field-level detail when possible

## Security Rules
- **Authorization**: Every protected route and Server Action must call `authorize()` or `requirePermission()`
- **Secrets**: Never commit `.env`; use `.env.example` for documentation
- **Passwords**: Hash with `bcrypt` only in `src/lib/auth.ts`
- **SQL Injection**: Always use Prisma; never concatenate raw SQL
- **XSS**: React escapes by default; do not use `dangerouslySetInnerHTML` without sanitization
- **CSRF**: NextAuth handles CSRF; validate `csrfToken` on sensitive mutations if needed
