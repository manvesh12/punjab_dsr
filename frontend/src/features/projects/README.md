# Projects Feature

Identity: Project Management Workspace.

## Architecture Contract

1. Folder structure: `layout/`, `pages/`, `components/`, `hooks/`, `services/`, `api/`, `types/`, `constants/`, `utils/`, `styles/`, `context/`, `store/`, `validation/`.
2. Component hierarchy: `ProjectsLayout -> ProjectsHome -> ProjectHeader, ProjectStats, ProjectFilters, ProjectTable, ProjectDrawer, ProjectActions`.
3. Layout architecture: dense workspace with filter rail, table region, and detail drawer.
4. State management: feature store for filters, search, selected project, drawer state, and table pagination.
5. API layer: `projectApi` wraps project CRUD and project metadata endpoints only.
6. Hooks: `useProjects`, `useProjectFilters`, `useProjectSearch`, `useProjectStatistics`.
7. Types: `Project`, `ProjectStatus`, `ProjectFilters`, `ProjectAction`.
8. Utilities: project display names, status mapping, progress calculations, district grouping.
9. Responsive strategy: table becomes cards on mobile, drawer becomes full-screen sheet.
10. Reusable components: shared `Table`, `Pagination`, `Badge`, `Modal`, `Input`, `Button`.
11. Performance: virtualized tables, debounced search, memoized stats, optimistic filtering.
12. Scalability: project plugins can add table columns and action menus through a registry.
