# Workflow Feature

Identity: Approval Pipeline.

## Architecture Contract

1. Folder structure: standard feature folders.
2. Component hierarchy: `WorkflowLayout -> WorkflowHome -> StageTimeline, ReviewQueue, ApprovalActions, RemarksPanel, HistoryList`.
3. Layout architecture: pipeline-first page with stage timeline and review side panel.
4. State management: feature store for selected report, active stage, remarks, and review action state.
5. API layer: `workflowApi` wraps workflow history and workflow action endpoints only.
6. Hooks: `useWorkflow`, `useWorkflowHistory`, `useWorkflowActions`, `useApprovalStages`.
7. Types: `WorkflowStage`, `WorkflowAction`, `WorkflowHistoryEntry`, `ReviewRemarks`.
8. Utilities: stage ordering, permission checks, status labels, history grouping.
9. Responsive strategy: timeline collapses to vertical stepper on tablet and mobile.
10. Reusable components: shared `Stepper`, `Button`, `Modal`, `Toast`, `Badge`.
11. Performance: memoized stage derivation, lazy history drawer, skeleton review rows.
12. Scalability: supports additional authority stages without changing page composition.
