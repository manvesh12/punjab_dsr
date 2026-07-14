# Dashboard Feature

Identity: Executive Overview.

## Architecture Contract

1. Folder structure: `layout/`, `pages/`, `components/`, `hooks/`, `services/`, `api/`, `types/`, `constants/`, `utils/`, `styles/`, `context/`, `store/`, `validation/`.
2. Component hierarchy: `DashboardLayout -> DashboardHome -> WelcomeSection, KpiCards, ChartsSection, QuickActions, RecentActivity, NotificationsPanel`.
3. Layout architecture: fixed government topbar, dashboard-only collapsible sidebar, fluid content canvas.
4. State management: feature reducer for selected district, KPI filters, notice state, and sidebar state.
5. API layer: `dashboardApi` wraps dashboard stats and announcement endpoints only.
6. Hooks: `useDashboardStats`, `useDashboardFilters`, `useDashboardNotices`, `useDashboardSidebar`.
7. Types: `DashboardStats`, `DashboardNotice`, `DashboardFilter`, `DashboardQuickAction`.
8. Utilities: format KPI values, map status colors, normalize district filter values.
9. Responsive strategy: sidebar collapses to icon rail, cards stack, charts lazy load below fold.
10. Reusable components: consume shared `Card`, `Button`, `Search`, `Sidebar`, `Topbar`, `ChartShell`.
11. Performance: memoized cards, dynamic chart imports, skeleton KPI loading, deferred map initialization.
12. Scalability: dashboard widgets register through a widget manifest for future executive modules.
