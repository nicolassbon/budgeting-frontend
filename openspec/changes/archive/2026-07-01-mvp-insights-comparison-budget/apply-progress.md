# Apply Progress: MVP Insights, Monthly Comparison, Weekly Budget

## Status

Completed under maintainer-approved `size:exception` single-PR delivery.
Verification follow-up applied for the zero-budget weekly budget boundary and minimal AGENTS.md safety correction.
Backend-readiness amendment applied previously: weekly budget used a repository seam with localStorage default and a dormant feature-flagged HTTP adapter for the backend `persist-weekly-budget` contract. Phase 4 supersedes that default.
Backend activation amendment applied: weekly budget now uses the verified backend repository by default, with localStorage retained as an explicit degraded fallback via `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`.

## Completed Tasks

- [x] 1.1 Add Monday-start local week filtering in `lib/insights.ts`.
- [x] 1.2 Add `computeComparison` and exported `Comparison` contract.
- [x] 1.3 Add per-user localStorage weekly budget module and hook.
- [x] 1.4 Extend insights utility tests for monthly comparison and week boundaries.
- [x] 1.5 Add weekly budget persistence tests.
- [x] 1.6 Run PR 1 gate checks.
- [x] 2.1 Add real `InsightsScreen` with three blocks.
- [x] 2.2 Render monthly comparison from store expenses and mutation signal.
- [x] 2.3 Render accessible weekly budget form using `useWeeklyBudget(user.email)`.
- [x] 2.4 Wire `#/insights` to `InsightsScreen` in `AppFrame`.
- [x] 2.5 Replace dashboard placeholders with `#/insights` links.
- [x] 2.6 Update dashboard screen tests.
- [x] 2.7 Add insights screen component tests.
- [x] 2.8 Run PR 2 gate checks with known format caveat.
- [x] V1 Fix zero-budget weekly budget usage so `0` with no spending renders `0% usado` instead of `NaN% usado`.
- [x] V2 Add zero-budget boundary coverage for zero and nonzero weekly spending.
- [x] V3 Correct AGENTS.md safety guidance for current auth, sections, and categories reality.
- [x] 3.1 Add RED coverage for weekly budget repository selection and backend contract behavior.
- [x] 3.2 Introduce `WeeklyBudgetRepository` seam with localStorage and backend implementations while preserving `useWeeklyBudget(email)`.
- [x] 3.3 Initially keep localStorage as default and gate backend mode behind `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=true`; superseded by Phase 4 after backend verification.
- [x] 3.4 Align the dormant backend adapter to `GET/PUT /auth/me/weekly-budget`, `{ amount: number | null }`, valid `0`, unset `null`, and `X-XSRF-TOKEN` on `PUT`.
- [x] 3.5 Preserve zero-budget Insights UI behavior and tests.
- [x] 3.6 Update proposal/spec/design/tasks/apply-progress narrowly; backend untouched.
- [x] 3.7 Run amendment verification gate with known untouched OpenSpec formatting caveat.
- [x] 4.1 Add RED coverage proving backend weekly budget is selected by default and localStorage remains explicit fallback.
- [x] 4.2 Make backend weekly budget the active default path while preserving `useWeeklyBudget(email)`.
- [x] 4.3 Update affected localStorage hook tests to exercise fallback through `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`.
- [x] 4.4 Update proposal/spec/design/tasks/apply-progress narrowly for backend-on-by-default; backend untouched.

## TDD Cycle Evidence

| Task | Test File                                             | Layer       | Safety Net                                 | RED                                                        | GREEN                             | TRIANGULATE                                            | REFACTOR                                               |
| ---- | ----------------------------------------------------- | ----------- | ------------------------------------------ | ---------------------------------------------------------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| 1.1  | `lib/insights.test.ts`                                | Unit        | ✅ 10/10 baseline                          | ✅ `getWeekExpenses` missing                               | ✅ targeted tests passed          | ✅ Monday boundary cases                               | ✅ shared local boundary helper kept minimal           |
| 1.2  | `lib/insights.test.ts`                                | Unit        | ✅ 10/10 baseline                          | ✅ `computeComparison` missing                             | ✅ targeted tests passed          | ✅ both-months, prev-empty, equal totals               | ✅ month label helper reused                           |
| 1.3  | `lib/weekly-budget.test.ts`                           | Unit/Hook   | N/A (new file)                             | ✅ module missing                                          | ✅ targeted tests passed          | ✅ namespace, invalid JSON, write/read/clear           | ✅ runtime shape guard extracted                       |
| 1.4  | `lib/insights.test.ts`                                | Unit        | ✅ 10/10 baseline                          | ✅ assertions failed before helpers                        | ✅ 13/13 passed                   | ✅ 4 new behavior cases                                | ✅ local date test data aligned to local-time contract |
| 1.5  | `lib/weekly-budget.test.ts`                           | Unit/Hook   | N/A (new file)                             | ✅ module missing                                          | ✅ 4/4 passed                     | ✅ missing/invalid/different-user cases                | ✅ no extra mocks beyond localStorage                  |
| 1.6  | `lib/insights.test.ts`, `lib/weekly-budget.test.ts`   | Gate        | ✅ baseline captured                       | ✅ gate failed before production                           | ✅ targeted tests + `tsc` passed  | ✅ full targeted file set passed                       | ✅ lint warning addressed                              |
| 2.1  | `components/screens/insights-screen.test.tsx`         | Component   | N/A (new file)                             | ✅ screen missing                                          | ✅ component tests passed         | ✅ block rendering + empty states                      | ✅ kept sub-blocks presentational                      |
| 2.2  | `components/screens/insights-screen.test.tsx`         | Component   | N/A (new file)                             | ✅ comparison UI absent                                    | ✅ component tests passed         | ✅ data and prev-empty scenarios                       | ✅ dependency signal preserved without lint warnings   |
| 2.3  | `components/screens/insights-screen.test.tsx`         | Component   | N/A (new file)                             | ✅ weekly budget UI absent                                 | ✅ component tests passed         | ✅ set budget + existing budget cases                  | ✅ native form + label/error semantics                 |
| 2.4  | `components/app-frame.tsx` + existing app-frame tests | Integration | ✅ existing app frame suite in full test   | ✅ placeholder still rendered before edit                  | ✅ full test/build passed         | ✅ hash route existing coverage retained               | ✅ import-only wiring                                  |
| 2.5  | `components/screens/dashboard-screen.test.tsx`        | Component   | ✅ dashboard baseline passed               | ✅ placeholder-copy test failed                            | ✅ dashboard tests passed         | ✅ no-placeholder + two links                          | ✅ plain anchors avoid routing churn                   |
| 2.6  | `components/screens/dashboard-screen.test.tsx`        | Component   | ✅ dashboard baseline passed               | ✅ new assertions failed before edit                       | ✅ 2/2 passed                     | ✅ link count + href checks                            | ✅ test remains user-visible                           |
| 2.7  | `components/screens/insights-screen.test.tsx`         | Component   | N/A (new file)                             | ✅ screen missing                                          | ✅ 4/4 passed                     | ✅ blocks, empty state, computed data, budget write    | ✅ pure selectors used where possible                  |
| 2.8  | Full suite                                            | Gate        | ✅ targeted + full tests                   | ✅ `format:check` fails on known OpenSpec markdown caveat  | ✅ lint, tests, tsc, build passed | ✅ 78 tests full suite                                 | ✅ formatted changed app/test files only               |
| V1   | `components/screens/insights-screen.test.tsx`         | Component   | ✅ 4/4 baseline                            | ✅ zero-budget/zero-spend test failed with `NaN% usado`    | ✅ 6/6 targeted tests passed      | ✅ zero-spend and nonzero-spend zero-budget cases      | ✅ minimal branch preserved existing 999% cap          |
| V2   | `components/screens/insights-screen.test.tsx`         | Component   | ✅ 4/4 baseline                            | ✅ missing boundary coverage from verify report            | ✅ full suite passed              | ✅ 2 new user-visible percent-used cases               | ✅ behavioral assertions only                          |
| V3   | `AGENTS.md`                                           | Docs        | N/A (docs-only)                            | ✅ verify warning documented stale guidance                | ✅ formatting unchanged           | ➖ Single safety correction                            | ✅ minimal scoped correction only                      |
| 3.1  | `lib/weekly-budget.test.ts`                           | Unit        | ✅ 10/10 weekly budget + insights baseline | ✅ repository exports missing; 4 new tests failed          | ✅ 8/8 weekly-budget tests passed | ✅ default local, flag selection, GET null, PUT 0/null | ✅ assertions target transport contract, not internals |
| 3.2  | `lib/weekly-budget.test.ts`                           | Unit/Hook   | ✅ 4/4 weekly-budget baseline              | ✅ `WeeklyBudgetRepository` seam absent                    | ✅ targeted tests passed          | ✅ local and backend implementations exercised         | ✅ hook API stayed `{ budget, setAmount, clear }`      |
| 3.3  | `lib/weekly-budget.test.ts`                           | Unit        | ✅ 4/4 weekly-budget baseline              | ✅ feature flag resolver absent                            | ✅ targeted tests passed          | ✅ true/TRUE/default-off cases                         | ✅ backend mode remains opt-in only                    |
| 3.4  | `lib/weekly-budget.test.ts`                           | Unit        | ✅ 4/4 weekly-budget baseline              | ✅ HTTP adapter absent                                     | ✅ targeted tests passed          | ✅ `0` write and `null` clear cases                    | ✅ shared request mapper kept thin                     |
| 3.5  | `components/screens/insights-screen.test.tsx`         | Component   | ✅ 6/6 baseline                            | ✅ preserved existing zero-budget coverage                 | ✅ 6/6 insights tests passed      | ✅ zero-spend and nonzero-spend zero-budget cases      | ✅ no Insights UI contract change                      |
| 3.6  | OpenSpec artifacts                                    | Docs        | ✅ previous apply-progress read and merged | ✅ amendment not reflected in artifacts                    | ✅ artifacts updated              | ➖ Single docs alignment pass                          | ✅ backend untouched                                   |
| 3.7  | Full project gate                                     | Gate        | ✅ targeted amendment suite passed         | ✅ format caveat remains isolated                          | ✅ lint/test/tsc/build passed     | ✅ full suite 84/84                                    | ✅ touched markdown formatted                          |
| 4.1  | `lib/weekly-budget.test.ts`                           | Unit        | ✅ 14/14 weekly budget + insights baseline | ✅ default-selection test failed while local was default   | ✅ 9/9 weekly-budget tests passed | ✅ default backend + explicit fallback cases           | ✅ assertions target public repository selection       |
| 4.2  | `lib/weekly-budget.ts`                                | Unit/Hook   | ✅ 8/8 weekly-budget baseline              | ✅ default backend assertion failed before production edit | ✅ targeted tests passed          | ✅ backend/default/fallback paths                      | ✅ one-line selector change preserves hook API         |
| 4.3  | `lib/weekly-budget.test.ts`                           | Hook        | ✅ 8/8 weekly-budget baseline              | ✅ local hook test no longer matched default behavior      | ✅ targeted tests passed          | ✅ fallback flag exercises localStorage path           | ✅ no noisy backend fetch in local fallback test       |
| 4.4  | OpenSpec artifacts                                    | Docs        | ✅ previous apply-progress read and merged | ✅ backend-on-default not reflected in artifacts           | ✅ artifacts updated              | ➖ Single docs alignment pass                          | ✅ backend untouched                                   |

## Test Summary

- Total tests written/updated: 20 new assertions/test cases across 4 files, including repository/backend-adapter/default-selection coverage.
- Total tests passing: 85/85 in full `pnpm test`; targeted activation suite 15/15 (`lib/weekly-budget.test.ts`, `components/screens/insights-screen.test.tsx`).
- Layers used: Unit, hook, component/integration.
- Approval tests: None — behavior was additive, not a refactor-only task.
- Pure functions created: `getWeekExpenses`, `computeComparison`, `weeklyBudgetKey`, `readWeeklyBudget`, `writeWeeklyBudget`, `createWeeklyBudgetRepository`.

## Verification

- `pnpm format:check` — failed only on the known pre-existing OpenSpec markdown formatting caveat. After the amendment formatting pass, the remaining untouched files are `exploration.md` and `verify-report.md`.
- `pnpm lint` — passed.
- `pnpm test` — passed, 14 files / 84 tests.
- `pnpm exec tsc --noEmit` — passed.
- `pnpm build` — passed.
- Amendment targeted safety net: `pnpm test lib/weekly-budget.test.ts components/screens/insights-screen.test.tsx` — baseline passed 10/10 before production changes.
- Amendment RED: `pnpm test lib/weekly-budget.test.ts` — failed 4 new tests because repository/backend adapter exports did not exist yet.
- Amendment GREEN/REFACTOR: `pnpm test lib/weekly-budget.test.ts components/screens/insights-screen.test.tsx` — passed, 2 files / 14 tests.
- Amendment gate: `pnpm format:check` — failed only on untouched known OpenSpec markdown drift (`exploration.md`, `verify-report.md`). Touched app/test/OpenSpec files were formatted with Prettier.
- Amendment gate: `pnpm lint` — passed.
- Amendment gate: `pnpm test` — passed, 14 files / 84 tests. Existing React `act(...)` warnings appeared in `components/capture-console.test.tsx`, unrelated to this change.
- Amendment gate: `pnpm exec tsc --noEmit` — passed.
- Amendment gate: `pnpm build` — passed.
- Backend activation safety net: `pnpm test lib/weekly-budget.test.ts components/screens/insights-screen.test.tsx` — baseline passed 14/14 before production changes.
- Backend activation RED: `pnpm test lib/weekly-budget.test.ts` — failed 1 new default-selection test because `createWeeklyBudgetRepository(undefined)` still selected localStorage.
- Backend activation GREEN/REFACTOR: `pnpm test lib/weekly-budget.test.ts components/screens/insights-screen.test.tsx` — passed, 2 files / 15 tests.
- Backend activation gate: `pnpm format:check` — failed only on untouched known OpenSpec markdown drift (`exploration.md`, `verify-report.md`). Touched app/test/OpenSpec files were formatted with Prettier.
- Backend activation gate: `pnpm lint` — passed.
- Backend activation gate: `pnpm test` — passed, 14 files / 85 tests. Existing React `act(...)` warnings appeared in `components/capture-console.test.tsx`, unrelated to this change.
- Backend activation gate: `pnpm exec tsc --noEmit` — passed.
- Backend activation gate: `pnpm build` — passed.

## Deviations

- AGENTS.md was edited only for the verified safety issue (current auth, sections, and categories reality); broad documentation cleanup remains out of scope.
- Manual Tab/screen-reader smoke was not executable in this headless apply session; semantics were covered with native headings, links, label, form, `aria-invalid`, `aria-describedby`, and `role="alert"`.
- Backend weekly-budget mode is now the active default because backend `persist-weekly-budget` is implemented and verified; localStorage remains available with `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false` as a degraded fallback.
