# Radix UI Skill

## Overview
Radix UI v1.6.0 — unstyled, accessible component primitives used under the hood by shadcn/ui and directly in the Chaatwala-Basic project.

## Core Concepts
- **Unstyled Primitives**: Radix provides behavior and accessibility; styling is applied via Tailwind CSS
- **Composition**: Components are designed to be composed together (e.g., `Dialog` → `DialogTrigger` + `DialogContent` + `DialogClose`)
- **Accessibility First**: All components include keyboard navigation, focus management, and ARIA attributes out of the box

## Project-Specific Usage
- **Dialog / Modal**: Used via shadcn/ui `dialog.tsx` (if installed) or direct Radix `Dialog` for admin modals (create/edit dish, drink)
- **Dropdown Menu**: Used via shadcn/ui for navigation and action menus
- **Toast**: `sonner` (built on Radix `Toaster`) for notifications
- **Navigation Menu**: shadcn/ui `navigation-menu.tsx` wraps Radix for desktop/mobile nav
- **Sheet**: shadcn/ui `sheet.tsx` wraps Radix `Dialog` for slide-over panels
- **Tabs**: Used for dashboard sections and settings pages
- **Tooltip**: Used for icon buttons and truncated text

## Best Practices
- Always provide `asChild` prop when composing Radix components with custom elements (e.g., wrapping a `Link` in `DialogTrigger`)
- Use `React.forwardRef` when wrapping Radix components to preserve ref forwarding
- Manage open/close state with React `useState` or Radix's own state hooks
- Use `onOpenChange` to synchronize Radix state with application state
- Do not remove `data-*` attributes or ARIA props added by Radix
- Test keyboard interactions (Enter, Escape, Tab) for all composed components

## Common Mistakes to Avoid
- **Styling conflicts**: Radix adds specific data attributes and classes; do not override with `!important` or conflicting Tailwind utilities
- **Missing `asChild`**: When rendering a Radix component as a different element (e.g., `<a>` inside `Button`), always use `asChild` to avoid nested buttons
- **Z-index issues**: Radix uses `var(--radix-*)` CSS variables for layering; ensure Tailwind z-index values do not conflict
- **Portal mounting**: Radix portals render outside the DOM hierarchy; ensure global styles apply correctly to portaled content
