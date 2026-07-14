# Features

Each folder in this directory is a bounded frontend feature. Features should be independently maintainable and should expose a small public surface through their page or layout entry points.

## Standard Feature Folders

```txt
layout/       Feature-specific chrome and page shell
pages/        Route-level page compositions
components/   Small feature components and sections
hooks/        Feature hooks and query/state orchestration
services/     Business-facing frontend services
api/          Existing backend endpoint wrappers for this feature only
types/        Feature TypeScript models
constants/    Labels, statuses, route ids, options
utils/        Pure helper functions
styles/       Feature CSS modules or scoped styles
context/      Feature-scoped React context
store/        Feature-scoped reducer/store
validation/   Feature form and payload validation
```

## Dependency Rule

Allowed:

- `features/projects` imports from `shared`
- `features/projects` imports from its own `api`, `hooks`, `types`, `utils`

Avoid:

- `features/projects` importing `features/workflow/api`
- `features/dashboard` mutating `features/projects/store`
- Shared components importing feature code
