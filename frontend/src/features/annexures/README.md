# Annexures Feature

Identity: Annexure Workspace.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `AnnexuresLayout -> AnnexurePage -> AnnexureNav, AnnexureForm, EvidencePanel, ValidationSummary`.
3. Layout architecture: section navigation with form workspace and evidence panel.
4. State management: per-annexure form state, validation state, upload state, and active section.
5. API layer: `annexureApi` wraps annexure data and file endpoints only.
6. Hooks: `useAnnexure`, `useAnnexureValidation`, `useAnnexureUploads`, `useAnnexureNavigation`.
7. Types: `AnnexureId`, `AnnexureSection`, `AnnexurePayload`, `AnnexureValidationIssue`.
8. Utilities: section labels, validation mapping, upload metadata helpers.
9. Responsive strategy: navigation becomes sticky segmented control on mobile.
10. Reusable components: shared `FormField`, `Table`, `Upload`, `Badge`, `Toast`.
11. Performance: lazy annexure sections, memoized validation, split heavy tables.
12. Scalability: each annexure can become its own child package if it exceeds size limits.
