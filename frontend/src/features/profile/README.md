# Profile Feature

Identity: Profile Center.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `ProfileLayout -> ProfileHome -> ProfileSummary, PreferencePanel, SessionPanel, SecurityPanel`.
3. Layout architecture: personal account workspace with grouped preference cards.
4. State management: profile form state, preference state, active sessions, and save status.
5. API layer: `profileApi` wraps current-user and preference endpoints only.
6. Hooks: `useProfile`, `useProfilePreferences`, `useSessionInfo`, `useProfileSave`.
7. Types: `Profile`, `ProfilePreference`, `SessionInfo`, `ProfileUpdatePayload`.
8. Utilities: initials, role display, preference normalization.
9. Responsive strategy: summary becomes top card, panels stack on mobile.
10. Reusable components: shared `Avatar`, `Card`, `Input`, `Toggle`, `Toast`.
11. Performance: lazy secondary panels, memoized preference updates.
12. Scalability: profile sections can be added without changing account shell.
