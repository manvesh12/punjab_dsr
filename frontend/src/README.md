# DSR Portal Frontend Architecture

This `src/` tree is the migration target for the enterprise Next.js frontend. It is intentionally additive and non-breaking: existing routes, backend APIs, authentication, database schema, and legacy business logic remain unchanged until each feature is migrated behind the same route contract.

## Target Structure

```txt
src/
  app/
  components/
  features/
    dashboard/
    projects/
    workflow/
    audit/
    settings/
    districts/
    reports/
    annexures/
    users/
    notifications/
    analytics/
    profile/
    support/
    authentication/
  shared/
```

## Feature Contract

Every feature owns its layout, pages, components, hooks, services, API wrapper, types, constants, utilities, styles, context, store, and validation. A feature may import from `shared/`, but it must not import another feature's internal `api/`, `services/`, `store/`, or `context/`.

```txt
features/<feature>/
  layout/
  pages/
  components/
  hooks/
  services/
  api/
  types/
  constants/
  utils/
  styles/
  context/
  store/
  validation/
```

## Enterprise Rules

1. Keep backend APIs, auth, database schema, and business rules stable.
2. Preserve current public routes while replacing page internals feature by feature.
3. Keep shared state minimal; feature state belongs inside the feature.
4. Keep components below 300 lines. Split complex pages into sections and widgets.
5. Use feature-owned API clients. No direct cross-feature API access.
6. Lazy load feature entry points with Next dynamic imports where practical.
7. Use skeleton loading for route transitions and data-heavy panels.
8. Virtualize large tables in Projects, Audit, Reports, Users, and Analytics.
9. Share design tokens, primitives, and accessibility behavior through `shared/`.
10. Treat `public/legacy` as a compatibility layer during migration, not the final architecture.

## Page Identities

| Feature | Product Identity | Primary Purpose |
| --- | --- | --- |
| Dashboard | Executive Overview | District-wide status, KPIs, notices, and quick navigation |
| Projects | Project Management Workspace | Create, browse, edit, and track DSR projects |
| Workflow | Approval Pipeline | Review stages, authority actions, and submission status |
| Audit | Security Monitoring | User activity, workflow events, and compliance traceability |
| Settings | Configuration Center | Portal configuration, permissions, and preferences |
| Districts | District Management | Punjab district map, filters, and district-specific context |
| Reports | Report Management | Generated PDFs, previews, downloads, and report lifecycle |
| Annexures | Annexure Workspace | Annexure data entry, validation, and supporting evidence |
| Users | User Administration | Users, roles, districts, blocks, and access control views |
| Notifications | Communication Center | Announcements, alerts, and system messages |
| Analytics | Business Intelligence Dashboard | Trends, throughput, compliance, and performance insights |
| Profile | Profile Center | User profile, session preferences, and account details |
| Support | Help Desk | Contact, FAQ, guides, and support workflows |
| Authentication | Access Gateway | Login, OTP, forgot/reset password, and auth UX |

## Migration Sequence

1. Introduce shared design tokens and primitives.
2. Migrate Authentication because it has limited dependencies.
3. Migrate Dashboard as a read-heavy executive shell.
4. Migrate Projects and Workflow together because workflows depend on project context.
5. Migrate Reports, Annexures, Districts, and Audit.
6. Migrate Users, Settings, Notifications, Profile, Support, and Analytics.
7. Remove legacy page internals only after parity tests pass.

## Verification Gate

Before a migrated feature replaces legacy behavior, verify:

- Route URL and auth behavior are unchanged.
- API calls use the existing endpoint contract.
- Existing user workflows still complete.
- Keyboard navigation and screen reader labels are present.
- Desktop, tablet, and mobile layouts have no horizontal scroll.
- Loading, empty, error, and permission-denied states are handled.
