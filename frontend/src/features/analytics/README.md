# Analytics Feature

Identity: Business Intelligence Dashboard.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `AnalyticsLayout -> AnalyticsHome -> MetricRibbon, TrendCharts, DistrictComparison, ComplianceInsights`.
3. Layout architecture: BI dashboard with filter bar and chart grid.
4. State management: feature state for date range, district selection, metrics, and chart preferences.
5. API layer: `analyticsApi` wraps analytics and aggregate endpoints only.
6. Hooks: `useAnalyticsMetrics`, `useAnalyticsFilters`, `useChartData`, `useDistrictComparison`.
7. Types: `AnalyticsMetric`, `ChartSeries`, `AnalyticsFilter`, `Insight`.
8. Utilities: chart transforms, percentage deltas, trend labels, export helpers.
9. Responsive strategy: chart grid collapses from 3 columns to 1 column.
10. Reusable components: shared `ChartShell`, `Card`, `DatePicker`, `Select`, `Loader`.
11. Performance: dynamic chart imports, cached aggregates, memoized transforms.
12. Scalability: metric cards and charts register through analytics manifests.
