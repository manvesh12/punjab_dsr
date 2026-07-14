# Audit Feature

Identity: Security Monitoring.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `AuditLayout -> AuditHome -> AuditHeader, AuditFilters, AuditTable, AuditDetailDrawer, ExportActions`.
3. Layout architecture: security console with immutable event table and filter summary.
4. State management: local reducer for filters, selected event, export state, and pagination.
5. API layer: `auditApi` wraps audit logs and report-history endpoints only.
6. Hooks: `useAuditLogs`, `useAuditFilters`, `useAuditExport`, `useAuditEventDetails`.
7. Types: `AuditEvent`, `AuditActor`, `AuditAction`, `AuditFilter`.
8. Utilities: actor labels, event severity, timestamp formatting, export field mapping.
9. Responsive strategy: preserve table on desktop, use event cards on mobile.
10. Reusable components: shared `Table`, `Search`, `DatePicker`, `Badge`, `Drawer`.
11. Performance: virtualized logs, server pagination, debounced filters, lazy export.
12. Scalability: event schema supports security, workflow, auth, and file events.
