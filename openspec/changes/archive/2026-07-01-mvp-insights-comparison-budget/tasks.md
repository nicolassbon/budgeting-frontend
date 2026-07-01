# Tasks: MVP Insights, Monthly Comparison, Weekly Budget

## Review Workload Forecast

| Field                       | Value                                      |
| --------------------------- | ------------------------------------------ |
| Estimated changed lines     | ~900 (650 impl + 250 tests)                |
| 800-line review budget risk | **High** (~100 over, ~12.5%)               |
| Chained PRs recommended     | **Yes**                                    |
| Suggested split             | PR 1 (lib foundation) → PR 2 (UI + wiring) |
| Delivery strategy           | size:exception (maintainer-approved)       |
| Chain strategy              | N/A — exception approved                   |

> Forecast breaches the 800-line budget. Slicing recommended explicitly
> per the user's brief and the design's "split into chained PRs"
> directive. User must choose `stacked-to-main`,
> `feature-branch-chain`, or accept `size:exception` before `sdd-apply`.

Decision needed before apply: No — maintainer-approved `size:exception`
Chained PRs recommended: Yes
Chain strategy: N/A
800-line budget risk: High

### Suggested Work Units

| Unit | Goal                               | Likely PR | Notes                                                                                                  |
| ---- | ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| 1    | Pure lib foundation + tests        | PR 1      | `lib/insights.ts` add, `lib/weekly-budget.ts` + tests. Base: `main` or `feature/mvp-insights` tracker. |
| 2    | UI surface, wiring, dashboard link | PR 2      | `InsightsScreen`, `app-frame` swap, dashboard link + test. Depends on PR 1 exports.                    |

> AGENTS.md is stale (categories, auth, Section) but full cleanup is
> explicitly out of scope. Follow `lib/types.ts` + `lib/auth.tsx`, not
> AGENTS.md. No AGENTS.md edit in this change.

---

## Phase 1 — Lib Foundation (PR 1)

- [x] 1.1 `lib/insights.ts`: add `getWeekExpenses(expenses, ref)` — Monday-start local week via `getDay()`/`getDate()` (mirror `getMonthExpenses`).
- [x] 1.2 `lib/insights.ts`: add `computeComparison(expenses, ref)` → `Comparison` (current/previous totals, absoluteDelta, `percentageDelta: null` when prev===0, direction, month labels, hasPreviousData). Export `Comparison`.
- [x] 1.3 `lib/weekly-budget.ts` (new): `weeklyBudgetKey(email)`, `readWeeklyBudget`, `writeWeeklyBudget`, `useWeeklyBudget` hook, `WeeklyBudget` type `{ amount, updatedAt }`. `readWeeklyBudget` returns `null` on missing/invalid JSON (try/catch + console.warn).
- [x] 1.4 Extend `lib/insights.test.ts`: both months, prev-empty → percentage null, equal totals, Monday boundary.
- [x] 1.5 New `lib/weekly-budget.test.ts` mocking `localStorage`: per-user namespacing, JSON shape, invalid fallback, write+clear round-trip.
- [x] 1.6 PR 1 gate: `pnpm test lib/insights.test.ts lib/weekly-budget.test.ts` + `pnpm exec tsc --noEmit` green.

## Phase 2 — UI Surface (PR 2)

- [x] 2.1 New `components/screens/insights-screen.tsx` (`'use client'`) composing 3 presentational sub-blocks in file: `SummaryBlock` (reuses `useDashboardStats`), `ComparisonBlock`, `WeeklyBudgetBlock`. Each block: `<h2>` heading + real empty state, no "próximamente".
- [x] 2.2 `ComparisonBlock`: reads `useStore().expenses` + `expenseMutationsVersion` (dep array); renders totals/delta/direction, or "Mes anterior sin movimientos" when `hasPreviousData === false`.
- [x] 2.3 `WeeklyBudgetBlock`: calls `useWeeklyBudget(user.email)`; native `<form>/<input type="number" min="0">` + `<label>`, es-AR placeholder, error via `aria-invalid` + `aria-describedby`.
- [x] 2.4 `components/app-frame.tsx`: replace placeholder `<div>` (lines 207–211) with `<InsightsScreen />`; hash routing untouched.
- [x] 2.5 `components/screens/dashboard-screen.tsx`: remove "Comparativa mensual próximamente" pill and "Presupuesto semanal próximamente." paragraph; add `<a href="#/insights">` link with es-AR label on each card.
- [x] 2.6 `components/screens/dashboard-screen.test.tsx`: assert `#/insights` link present and literal "próximamente" gone.
- [x] 2.7 New `components/screens/insights-screen.test.tsx` mocking `useStore`, `useDashboardStats`, `useWeeklyBudget`: 3 blocks, no "próximamente", prev-month empty state, per-user budget isolation.
- [x] 2.8 PR 2 gate: `pnpm format:check` → `pnpm lint` → `pnpm test` → `pnpm exec tsc --noEmit` → `pnpm build` green; manual Tab + screen-reader smoke of `#/insights`.

## Phase 3 — Weekly Budget Backend-Ready Seam Amendment

- [x] 3.1 `lib/weekly-budget.test.ts`: add RED coverage for repository selection, default localStorage mode, backend `GET` null mapping, backend `PUT` zero, backend clear-to-null, and CSRF header forwarding.
- [x] 3.2 `lib/weekly-budget.ts`: introduce `WeeklyBudgetRepository`, `localStorageWeeklyBudgetRepository`, `backendWeeklyBudgetRepository`, and `createWeeklyBudgetRepository(...)` while preserving the existing `useWeeklyBudget(email)` consumer API.
- [x] 3.3 `lib/weekly-budget.ts`: initially keep localStorage as default behavior and gate backend mode behind `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=true`; superseded by Phase 4 after backend verification.
- [x] 3.4 `lib/weekly-budget.ts`: align dormant backend adapter to `GET /auth/me/weekly-budget`, `PUT /auth/me/weekly-budget`, body `{ amount: number | null }`, valid `0`, unset `null`, and `X-XSRF-TOKEN` on `PUT`.
- [x] 3.5 Preserve zero-budget UI behavior with existing `components/screens/insights-screen.test.tsx` coverage for `0% usado` and capped nonzero spend.
- [x] 3.6 Update proposal/spec/design/tasks/apply-progress narrowly for the repository seam and dormant backend integration path; keep backend untouched.
- [x] 3.7 Amendment gate: `pnpm format:check` reports only pre-existing untouched OpenSpec markdown drift (`exploration.md`, `verify-report.md`); `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build` pass.

## Phase 4 — Backend Weekly Budget Activation Amendment

- [x] 4.1 `lib/weekly-budget.test.ts`: add RED coverage proving the backend repository is selected by default and localStorage remains available only as an explicit fallback.
- [x] 4.2 `lib/weekly-budget.ts`: make backend weekly budget the active default path while preserving the existing `useWeeklyBudget(email)` consumer API.
- [x] 4.3 `lib/weekly-budget.test.ts`: update affected fallback/hook tests so localStorage behavior is exercised through `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`.
- [x] 4.4 Update proposal/spec/design/tasks/apply-progress narrowly to reflect backend-on-by-default with localStorage fallback retained; keep backend untouched.
