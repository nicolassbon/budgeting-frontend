# Verify Report: MVP Insights, Monthly Comparison, Weekly Budget

## Verdict

PASS WITH WARNINGS.

The frontend implementation satisfies the current `spending-insights` spec after backend weekly budget activation. Runtime verification passed for lint, tests, type-check, and build. `pnpm format:check` still fails, but only for untouched OpenSpec markdown drift in `exploration.md`; no application implementation files are implicated.

## Evidence

| Command                  | Result | Notes                                                                                                                                                                          |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm format:check`      | Failed | After persisting and formatting this report, only `openspec/changes/mvp-insights-comparison-budget/exploration.md` is reported. No app/test implementation files are reported. |
| `pnpm lint`              | Passed | ESLint completed with no reported errors.                                                                                                                                      |
| `pnpm test`              | Passed | 14 files, 85 tests passed. Existing React `act(...)` warnings appeared in `components/capture-console.test.tsx`, unrelated to this change.                                     |
| `pnpm exec tsc --noEmit` | Passed | No errors before `pnpm build`.                                                                                                                                                 |
| `pnpm build`             | Passed | Next.js production build completed successfully.                                                                                                                               |

## Scope Compliance

| Area                          | Status | Evidence                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insights screen               | PASS   | `AppFrame` renders `InsightsScreen` for `#/insights`; component tests verify the three blocks and absence of placeholder copy.                                                                                                                                                                     |
| Monthly comparison            | PASS   | `computeComparison` uses store expenses, handles both-month and previous-empty states, and returns `percentageDelta: null` when previous month total is zero. Runtime tests cover both data and no-previous-data scenarios.                                                                        |
| Weekly budget                 | PASS   | `useWeeklyBudget` goes through a repository seam; backend is the default repository; localStorage remains explicit fallback with `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`. Runtime tests cover backend default, fallback, GET null mapping, PUT zero, clear null, and CSRF header forwarding. |
| Backend contract alignment    | PASS   | Backend archive/spec/code expose authenticated `GET/PUT /auth/me/weekly-budget` with `{ amount: number \| null }`; `PUT` uses existing CSRF protections and rejects invalid/negative values. Frontend calls the same path/body and sends `X-XSRF-TOKEN`.                                           |
| Local fallback safety         | PASS   | Fallback still uses per-user `budgeting_weekly_budget_{userEmail}` localStorage and makes no backend calls when selected by explicit `false` flag.                                                                                                                                                 |
| Zero-budget handling          | PASS   | UI returns finite `0% usado` for zero budget + zero spend, and capped `999% usado` for zero budget + nonzero spend; tests cover both and assert no `NaN`/`Infinity`.                                                                                                                               |
| Dashboard placeholder removal | PASS   | Dashboard tests verify `próximamente` is absent and `#/insights` links are present.                                                                                                                                                                                                                |
| AGENTS.md safety correction   | PASS   | Current AGENTS.md now reflects backend auth, `insights` section routing, and backend-aligned closed categories; no further minimal correction is required for this change.                                                                                                                         |

## Backend Reference

The requested active backend path `openspec/changes/persist-weekly-budget` is absent because the backend change is archived at `openspec/changes/archive/2026-07-01-persist-weekly-budget`. The archived proposal/spec/design/tasks/verify-report and live backend source agree on the contract: authenticated `GET/PUT /auth/me/weekly-budget`, response/request shape `{ "amount": number | null }`, nullable persisted column, `0` valid via `@PositiveOrZero`, `null` unset/clear, and CSRF required for state-changing writes.

## TDD Compliance

| Check                 | Result  | Details                                                                                                                                                                                            |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TDD evidence reported | PASS    | `apply-progress.md` includes a detailed TDD Cycle Evidence table through Phase 4.                                                                                                                  |
| RED/GREEN evidence    | PASS    | Reported test files exist and passed in the full `pnpm test` run.                                                                                                                                  |
| Scenario coverage     | PASS    | Required frontend scenarios are covered by `lib/insights.test.ts`, `lib/weekly-budget.test.ts`, `components/screens/insights-screen.test.tsx`, and `components/screens/dashboard-screen.test.tsx`. |
| Assertion quality     | PASS    | Reviewed related tests contain behavioral assertions; no tautologies, ghost loops, or smoke-only tests were found.                                                                                 |
| Coverage              | SKIPPED | No coverage tool is configured.                                                                                                                                                                    |

## Issues

### CRITICAL

- None.

### WARNING

- `pnpm format:check` still fails on OpenSpec markdown drift only. Treat this as baseline/artifact formatting debt, not an implementation regression.
- Manual Tab/screen-reader smoke was not executable in this headless verification. The implementation uses semantic headings, anchors, labels, native form controls, `aria-invalid`, `aria-describedby`, and `role="alert"`, with component tests covering the rendered behaviors.
- The backend reference path supplied in the prompt is archived rather than active; verification used the archived durable OpenSpec artifacts plus live backend source.

### SUGGESTION

- Consider formatting the untouched OpenSpec markdown drift before archive if the archive process requires a clean `pnpm format:check`.
