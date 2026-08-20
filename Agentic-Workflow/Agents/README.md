# Chaatwala Agentic Workflow

This directory is the project-level operating system for AI-assisted development.

## Structure

```text
Agentic-Workflow/
├── README.md
├── architecture.md
├── authorization.md
├── security-audit.md
├── performance.md
├── development-workflow.md
├── task-template.md
├── review-checklist.md
└── release-checklist.md
```

## Operating principle

Codex is the implementation agent. These documents are context and guardrails.

Use this order:

1. Understand.
2. Plan.
3. Inspect.
4. Implement.
5. Test.
6. Review.
7. Summarize.

Do not ask the agent to "optimize everything". Give bounded tasks with explicit acceptance criteria.

## Source of truth

The current route architecture and current codebase are authoritative. Historical audit documents are useful for context, but must not override the current implementation.

## Recommended agent modes

### Read-only audit
Use for:
- route/auth tracing,
- session-flow investigation,
- performance profiling,
- dependency analysis,
- security audits.

No code changes.

### Targeted implementation
Use for:
- one security fix,
- one performance fix,
- one route/layout refactor,
- one feature.

Require tests and validation.

### Review
Use after implementation:
- inspect git diff,
- inspect changed files,
- run targeted tests,
- look for authorization regressions,
- look for request duplication,
- verify route boundaries.

## Never combine these into one uncontrolled task

Avoid a single prompt containing:
- auth refactor,
- permission redesign,
- performance optimization,
- UI redesign,
- database migration,
- deployment changes.

Split them into independent tasks.
