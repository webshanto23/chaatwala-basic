# Tailwind CSS Skill

## Overview
Tailwind CSS v4 with `@tailwindcss/postcss`. Uses CSS-first configuration and custom theme tokens.

## Core Concepts
- **CSS-First Config**: Tailwind v4 moves theme configuration to CSS custom properties rather than `tailwind.config.js`. However, this project still uses `tailwind.config.js` with extended theme values.
- **Custom Properties**: Colors like `primary`, `secondary`, `accent` reference CSS variables (`var(--primary)`, etc.) defined in `src/app/globals.css`.
- **Font Tokens**: `--font-fraunces` for headings, `--font-inter` for body text. Configured via `next/font` in the root layout.
- **Design System**: Built on shadcn/ui radix-nova style with neutral base color.

## Project-Specific Configuration
- **Config File**: `tailwind.config.js` extends theme with:
  - Font families: `heading` (fraunces), `body` (inter)
  - Font sizes: `display-lg`, `display-md`, `display-sm`, `hero`
  - Colors: `primary`, `secondary`, `accent`, `surface`
  - Background images: `gradient-primary`, `gradient-warm`
  - Animations: `spin-slow`
- **Content Paths**: Scans `src/pages/`, `src/components/`, `src/app/`
- **Base Color**: `neutral` (shadcn/ui radix-nova)
- **Prefix**: None

## Best Practices
- Use the `cn()` utility from `@/lib/utils` for class name composition (clsx + tailwind-merge)
- Never use inline `style` attributes; use Tailwind classes
- Use `class-variance-authority` (CVA) for component variants in `src/components/ui/`
- Use CSS variables for theming (light/dark mode support via `:root` and `.dark` in `globals.css`)
- Use `tw-animate-css` for animation utilities
- Keep Tailwind classes readable; extract repeated patterns into CVA variants or utility classes

## Common Mistakes to Avoid
- **Conflicting utilities**: When conditionally applying classes, always use `cn()` to let `tailwind-merge` resolve conflicts
- **Hardcoded colors**: Do not use arbitrary values like `text-[#123456]` when a CSS variable or design token exists
- **Missing content paths**: New directories under `src/` are not scanned by default; update `tailwind.config.js` content array if adding new component folders
- **Arbitrary values for spacing**: Use the existing spacing scale; avoid arbitrary margins/paddings unless absolutely necessary
- **Dark mode inconsistencies**: Ensure all color tokens have `.dark` variants in `globals.css`
