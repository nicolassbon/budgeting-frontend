# Mini Task Packet — align-history-dashboard-dates

- mini_sdd: true
- artifact_store: openspec
- change_slug: align-history-dashboard-dates
- metadata_path: openspec/changes/align-history-dashboard-dates/metadata.yaml
- allowed_surfaces:
  - lib/store.tsx
  - lib/store.test.ts
  - lib/insights.ts
  - lib/insights.test.ts
- forbidden_surfaces:
  - backend API contracts
  - unrelated UI refactors
- scope:
  1. Replace fan-out history loading with GET /transactions and map response.items.
  2. Replace dashboard local aggregate hook with GET /dashboard/spending mapping.
  3. Preserve backend dates in create/fetch/update flows instead of generating fresh client timestamps when backend supplies one.
- acceptance_criteria:
  - History fetch performs one GET /transactions request and preserves response item.date values.
  - Dashboard stats come from GET /dashboard/spending and keep UI-compatible month/category/amount values.
  - Create/update/fetch repository mapping preserves backend response date whenever present.
- security_alignment:
  - Preserve existing CSRF header behavior for mutations.
  - Dashboard/history GET requests remain read-only.
- strict_tdd: true
- validation_commands:
  - pnpm test
  - pnpm lint
  - pnpm exec tsc --noEmit
- skills:
  - /home/nico/.pi/agent/skills/workflow-triage/SKILL.md
  - /home/nico/.pi/agent/skills/sdd-workflow/SKILL.md
