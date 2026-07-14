# Support Feature

Identity: Help Desk.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `SupportLayout -> SupportHome -> ContactPanel, FaqSearch, GuideList, SupportRequestForm`.
3. Layout architecture: searchable support hub with contact and guide sections.
4. State management: query state, selected guide, request form, and submit status.
5. API layer: `supportApi` wraps support request and guide endpoints only.
6. Hooks: `useSupportGuides`, `useFaqSearch`, `useSupportRequest`, `useContactInfo`.
7. Types: `SupportGuide`, `FaqItem`, `SupportRequest`, `ContactInfo`.
8. Utilities: FAQ ranking, contact formatting, guide grouping.
9. Responsive strategy: guide grid becomes accordion list on mobile.
10. Reusable components: shared `Search`, `Accordion`, `Button`, `Input`, `Toast`.
11. Performance: lazy guide content, debounced FAQ search, deferred attachments.
12. Scalability: supports guide categories and support ticket integrations.
