# Users Feature

Identity: User Administration.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `UsersLayout -> UsersHome -> UsersHeader, UsersTable, UserDrawer, RoleEditor, ScopeEditor`.
3. Layout architecture: admin console with table and edit drawer.
4. State management: feature state for selected user, filters, role edits, and activation state.
5. API layer: `userApi` wraps user management endpoints only.
6. Hooks: `useUsers`, `useUserFilters`, `useUserRoles`, `useUserMutations`.
7. Types: `User`, `UserRole`, `UserScope`, `UserStatus`.
8. Utilities: role labels, access scope formatting, permission grouping.
9. Responsive strategy: table becomes user cards on mobile, drawer becomes sheet.
10. Reusable components: shared `Table`, `Badge`, `Input`, `Select`, `Modal`.
11. Performance: virtualized users table, debounced filters, lazy drawer content.
12. Scalability: supports new roles and scopes through constants, not hard-coded UI branches.
