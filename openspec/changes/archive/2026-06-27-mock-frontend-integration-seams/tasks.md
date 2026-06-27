# Tasks: Mock Frontend Integration Seams

## Review Workload Forecast

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Estimated changed lines | 500-700 lines                        |
| 400-line budget risk    | High                                 |
| Chained PRs recommended | Yes                                  |
| Suggested split         | Single large PR under size-exception |
| Delivery strategy       | single-pr                            |
| Chain strategy          | size-exception                       |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                          | Likely PR | Notes                                                 |
| ---- | --------------------------------------------- | --------- | ----------------------------------------------------- |
| 1    | Full implementation of mock integration seams | PR 1      | Single PR with size-exception as selected by the user |

## Phase 1: Foundation & Interfaces (Foundation)

- [x] 1.1 Update `lib/types.ts` to change `Category` to `'GROCERIES' | 'PHARMA' | 'AUTO'` and expose Category translation mapping helper.
- [x] 1.2 Implement `lib/auth.tsx` with `AuthProvider`, `useAuth()`, mock users database, and validations.
- [x] 1.3 Update `lib/store.tsx` to expose `ExpenseRepository`, `LocalStorageExpenseRepository` (isolated keys, mock delay, and seeding), and expose `loading` in StoreContext.

## Phase 2: UI Integration & Seams (Core Implementation)

- [x] 2.1 Update `components/app-frame.tsx` to display active user email from `useAuth()` and abstract navigation triggers.
- [x] 2.2 Update `components/expense-form-modal.tsx` to reset state via key-based re-mounting inside its parent.
- [x] 2.3 Update `components/screens/capture-screen.tsx` to handle async NLP interpretation and Speech API fallback banner.
- [x] 2.4 Update `components/screens/dashboard-screen.tsx` to consume pre-calculated stats from `useDashboardStats()`.
- [x] 2.5 Update `lib/insights.ts` to implement `useDashboardStats()` and separate pure calculator helpers.
- [x] 2.6 Migrate eslint task in `package.json` to call eslint directly.

## Phase 3: Testing & Verification (Testing)

- [x] 3.1 Write unit tests for insights calculations and auth validations.
- [x] 3.2 Write integration tests for LocalStorageExpenseRepository isolated user data.
- [x] 3.3 Verify form state resets on modal re-mount.
