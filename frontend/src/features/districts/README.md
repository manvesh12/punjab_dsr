# Districts Feature

Identity: District Management.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `DistrictsLayout -> DistrictsHome -> DistrictMap, DistrictList, DistrictFilters, DistrictDetails`.
3. Layout architecture: map-led workspace with district context panel.
4. State management: feature state for selected district, map readiness, filters, and highlight mode.
5. API layer: `districtApi` wraps district metadata and geojson fetches only.
6. Hooks: `useDistricts`, `useDistrictMap`, `useDistrictSelection`, `useDistrictFilters`.
7. Types: `District`, `DistrictGeoFeature`, `DistrictFilter`, `DistrictMetric`.
8. Utilities: district normalization, color assignment, geo bounds, label formatting.
9. Responsive strategy: map stacks above district list on mobile.
10. Reusable components: shared `MapShell`, `Search`, `Card`, `Badge`.
11. Performance: cache geojson, defer map rendering, memoize district geometry.
12. Scalability: supports block/section drilldown without changing feature boundaries.
