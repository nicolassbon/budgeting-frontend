# Proposal: MVP Insights, Monthly Comparison, Weekly Budget

## Intent

Ship the promised Insights experience by replacing placeholder copy with a focused MVP: current-month insights, month-over-month comparison, and a weekly budget persisted through the backend by default. A browser-local fallback remains available as a degraded path if backend budget persistence must be disabled.

## Scope

### In Scope

- Add an Insights screen for current-month summary, category breakdown, monthly comparison, and weekly budget.
- Compute monthly comparison from existing client-side expenses/store data.
- Persist weekly budget through the backend `GET/PUT /auth/me/weekly-budget` contract by default.
- Keep a weekly budget repository/service seam with an explicit `localStorage` degraded fallback, namespaced per authenticated user.
- Align the HTTP implementation with JSON `{ amount: number | null }`, including `0` as valid and `null` as unset.
- Replace dashboard “próximamente” chips with discovery links to Insights.

### Out of Scope

- Backend endpoints, schema changes, or budget domain aggregates in this frontend change.
- Backend schema/endpoints themselves; the backend `persist-weekly-budget` change is already implemented and verified.
- AGENTS.md/OpenSpec stale-spec cleanup, except a minimal correction if required for safe implementation.
- Broader dashboard redesign or unrelated transaction/history behavior.

## Capabilities

### New Capabilities

- `spending-insights`: Insights section behavior, monthly comparison, and local weekly budget MVP.

### Modified Capabilities

- None. Existing `integration-seams` and `user-transactions` specs are stale and should be corrected in a separate documentation/spec cleanup change.

## Approach

Implement one new `InsightsScreen` and supporting pure helpers in `lib/insights.ts`. Use existing store expenses for previous-month and current-week calculations; use `useDashboardStats` for current-month dashboard data. Keep `lib/weekly-budget.ts` as the single consumer seam: default to the backend repository now that `persist-weekly-budget` is verified, and select per-user `localStorage` only when `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false` is configured as a safe fallback. Keep UI copy es-AR and accessible, with native form controls and clear empty states.

## Affected Areas

| Area                                      | Impact       | Description                                                                                      |
| ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `components/app-frame.tsx`                | Modified     | Render `InsightsScreen` for `#/insights`.                                                        |
| `components/screens/insights-screen.tsx`  | New          | Main MVP surface for all three features.                                                         |
| `components/screens/dashboard-screen.tsx` | Modified     | Replace placeholders with link/CTA to Insights.                                                  |
| `lib/insights.ts`                         | Modified     | Add monthly comparison and week-budget selectors/helpers.                                        |
| `lib/weekly-budget.ts`                    | New/Modified | Per-user localStorage persistence plus dormant backend repository adapter behind a feature flag. |
| `*.test.ts(x)`                            | New/Modified | Pure helper and screen coverage.                                                                 |

## Risks

| Risk                                        | Likelihood | Mitigation                                                                                                                                                |
| ------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend weekly budget unavailable           | Med        | Keep explicit `localStorage` fallback selectable with `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`.                                                      |
| Legacy local-only values remain in browsers | Low        | Leave localStorage fallback intact; backend is source of truth by default after this change.                                                              |
| Week boundary ambiguity                     | Med        | Use Monday-start week and specify it.                                                                                                                     |
| Previous month has no data                  | High       | Show empty state, not misleading percentages.                                                                                                             |
| Review size                                 | Med        | Forecast 650–900 changed lines including tests; current review budget is 800 lines, so keep implementation tight or split during tasks if forecast grows. |

## Rollback Plan

Revert the new screen, helper, localStorage module, tests, and dashboard link changes. No backend or persisted server data rollback is required; localStorage keys can be ignored or removed by a follow-up cleanup.

## Dependencies

- Existing authenticated user, store expenses, and `useDashboardStats` behavior.
- Backend worktree remains untouched. Backend integration depends on the already implemented and verified `persist-weekly-budget` `GET/PUT /auth/me/weekly-budget` contract.

## Success Criteria

- [ ] `#/insights` shows real insights instead of a placeholder.
- [ ] Monthly comparison handles previous-month zero-data safely.
- [ ] Weekly budget survives refresh and device/browser changes through the backend contract.
- [ ] Weekly budget can switch to localStorage fallback behind an explicit opt-out without changing the Insights consumer API.
- [ ] Dashboard no longer advertises these MVP features as “próximamente”.
- [ ] Implementation remains within the 800-line review budget or is split before apply.
