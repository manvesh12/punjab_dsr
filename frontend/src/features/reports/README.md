# Reports Feature

Identity: Report Management.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `ReportsLayout -> ReportsHome -> ReportList, ReportPreview, ReportActions, ReportStatusPanel`.
3. Layout architecture: split report browser and preview workspace.
4. State management: feature reducer for selected report, preview mode, download state, and permissions.
5. API layer: `reportApi` wraps report list, upload, download, email, and PDF endpoints only.
6. Hooks: `useReports`, `useReportPreview`, `useReportDownload`, `useReportActions`.
7. Types: `Report`, `ReportStatus`, `PdfPreviewState`, `ReportAction`.
8. Utilities: file labels, report permissions, PDF URL builders, status colors.
9. Responsive strategy: preview becomes separate full-screen panel on mobile.
10. Reusable components: shared `Table`, `Button`, `Loader`, `Modal`, `Toast`.
11. Performance: lazy PDF preview, stream previews where possible, cache report metadata.
12. Scalability: supports new report types through report type adapters.
