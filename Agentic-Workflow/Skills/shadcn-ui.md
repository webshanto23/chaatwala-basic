# shadcn/ui Skill

## Overview
shadcn/ui v4.12.0 (radix-nova style) used as the foundational UI component library for Chaatwala-Basic.

## Core Concepts
- **Radix-Nova Style**: Modern, refined aesthetic with neutral base color and subtle accents
- **RSC Enabled**: Components are built for React Server Components with `"use client"` only where needed
- **Path Aliases**: Uses `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`
- **Icon Library**: Lucide React
- **Base Color**: Neutral

## Project-Specific Components
Installed components in `src/components/ui/`:
- `button.tsx` — Button with variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes
- `card.tsx` — Card container with header, content, footer
- `input.tsx` — Text input with form integration
- `textarea.tsx` — Multi-line text input
- `label.tsx` — Accessible label for form fields
- `badge.tsx` — Status/classification badge
- `table.tsx` — Data table with sorting support
- `navigation-menu.tsx` — Responsive navigation menu
- `sheet.tsx` — Slide-over panel (used for mobile menu, modals)
- `skeleton.tsx` — Loading placeholder
- `separator.tsx` — Visual divider
- `accordion.tsx` — Collapsible content sections
- `field.tsx` — Form field wrapper (shadcn v4)
- `input-group.tsx` — Input group with addons
- `auth-divider.tsx` — Divider for auth forms
- `decor-icon.tsx` — Decorative icon element

## Best Practices
- Import components from `@/components/ui/[component]`
- Use `class-variance-authority` (`cva`) for component variants
- Use `cn()` utility for dynamic class composition
- Do not modify base UI components directly; create wrapper components in `src/components/shared/` or `src/components/[domain]/` if customization is needed
- Compose UI components together (e.g., `Card` + `Button` + `Badge` for product cards)
- Use Radix UI primitives directly only when shadcn/ui does not provide the needed component

## Common Mistakes to Avoid
- **Modifying installed components**: If a shadcn/ui component needs project-specific changes, wrap it rather than editing the source file
- **Variant duplication**: Define variants with CVA, not with conditional className strings in JSX
- **Accessibility**: Always ensure labels are associated with inputs, buttons have discernible text, and dialogs have proper ARIA attributes (handled by Radix)
- **Inconsistent styling**: Stick to the radix-nova design tokens; do not introduce arbitrary colors or shadows
