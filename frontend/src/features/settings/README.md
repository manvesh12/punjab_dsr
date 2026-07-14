# Settings Feature

Identity: Configuration Center.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `SettingsLayout -> SettingsHome -> SettingsNav, GeneralSettings, RoleSettings, ThemeSettings, IntegrationSettings`.
3. Layout architecture: two-column configuration center with settings navigation and editable panels.
4. State management: feature store for dirty state, active section, validation errors, and save status.
5. API layer: `settingsApi` wraps settings endpoints only.
6. Hooks: `useSettings`, `useSettingsForm`, `useSettingsPermissions`, `useSettingsSave`.
7. Types: `PortalSettings`, `SettingsSection`, `SettingsPermission`, `SettingsPayload`.
8. Utilities: diff settings, validate changes, normalize role options.
9. Responsive strategy: settings nav becomes tabs on tablet and select menu on mobile.
10. Reusable components: shared `Tabs`, `Input`, `Toggle`, `Modal`, `Toast`.
11. Performance: lazy advanced panels, memoized options, isolated form sections.
12. Scalability: new settings sections register through a section manifest.
