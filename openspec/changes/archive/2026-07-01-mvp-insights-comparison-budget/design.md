# Design: MVP Insights, Monthly Comparison, Weekly Budget

## Technical Approach

Ship one new `InsightsScreen` composed of three thin presentational blocks, backed by pure selectors + a weekly budget repository seam. Reuse the existing `useDashboardStats` (current-month summary) and `useStore().expenses` (comparison + week totals). Use the backend weekly budget repository by default now that `persist-weekly-budget` is implemented and verified, and keep `localStorage` selectable only as a degraded fallback with `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`. No backend worktree changes. UI copy in es-AR, native controls, empty states. The `#/insights` route and `Section='insights'` already exist in `app-frame.tsx` as a placeholder — we replace the placeholder, not add routing.

## Architecture Decisions

| #   | Choice                                                                                                          | Alternatives rejected                   | Rationale                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Access weekly budget through a repository seam with backend default and per-user `localStorage` fallback        | Store/context; direct fetch inside UI   | Preserves the `useWeeklyBudget(email)` consumer API while making the verified backend persistence contract the active delivery path.                                           |
| 2   | Pure selectors in `lib/insights.ts` + React hook in same lib                                                    | Redux/Zustand slice                     | Codebase pattern: pure helpers + hooks; mirrors `computeMonthStats`/`useDashboardStats`. Easiest to unit-test.                                                                 |
| 3   | `getWeekExpenses` uses Monday-start local boundaries via local-time methods                                     | UTC; Intl week-year                     | Spec mandates local TZ to match `/dashboard/spending` totals. Use same `new Date(e.date).get…()` idiom as `getMonthExpenses` for consistency.                                  |
| 4   | `InsightsScreen` composes 3 sub-blocks via props (no context)                                                   | Compound + provider                     | Thin MVP; providers add ceremony without benefit. Sub-blocks stay presentational; data injected from screen via props (composition-pattern rule: decouple UI from state impl). |
| 5   | Compare depends on `expenseMutationsVersion` AND `expenses`                                                     | only expenses                           | Spec requires refresh on the same mutation signal as `useDashboardStats`; cheap belt-and-suspenders.                                                                           |
| 6   | Percentage delta `null` when previous month total is 0                                                          | show "-100%" / "+∞"                     | Spec scenario forbids misleading "-100%"; render "Mes anterior sin movimientos".                                                                                               |
| 7   | Backend weekly budget mode is active by default; `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false` selects fallback | Keep backend dormant after verification | Backend `persist-weekly-budget` is now implemented and verified, so delivery should persist across devices by default while retaining a safe local fallback.                   |
| 8   | HTTP adapter maps `{ amount: null }` to unset and preserves `0` as valid                                        | Treat falsy as unset                    | Backend contract uses `null` as the only unset sentinel; `0` is a valid budget and must not collapse to empty.                                                                 |

## Data Flow

```
BudgetingApp ── AppFrame ──┬── (section==='insights') ── InsightsScreen
                           │         │           │           │
                           │   useDashboardStats   useStore(expenses, expenseMutationsVersion)   useWeeklyBudget(email)
                           │  (reuse)             └→ computeComparison(expenses,ref)             └→ getWeekExpenses(...)
                           │                      └→ getWeekExpenses(...)                        └→ WeeklyBudgetRepository
                            │                                                                  ├─ default: GET/PUT /auth/me/weekly-budget
                            │                                                                  └─ fallback: localStorage when explicitly disabled
                           └── (section==='inicio') ─ DashboardScreen → link #/insights
```

- `useDashboardStats` (existing) → block 1 current-month summary + breakdown.
- `computeComparison` (new, pure) reads `useStore().expenses` → block 2.
- `getWeekExpenses` (new, pure) reads same `expenses` → block 3 spent.
- `useWeeklyBudget` (hook in `lib/weekly-budget.ts`) → block 3 budget persistence through `WeeklyBudgetRepository` while keeping the consumer API stable.

## File Changes

| File                                           | Action        | Description                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `lib/insights.ts`                              | Modify        | Add `getWeekExpenses(expenses,ref)` (Mon-start local), `computeComparison(expenses,ref)` returning `Comparison`. Export `Comparison` interface.                                                                                                                                                                         |
| `lib/weekly-budget.ts`                         | Create/Modify | `weeklyBudgetKey(email)`, `readWeeklyBudget(email)`, `writeWeeklyBudget(email,amount)`, `WeeklyBudgetRepository`, localStorage fallback repository, backend default repository, `createWeeklyBudgetRepository(flag)`, `useWeeklyBudget(email)` hook. Local JSON `{ amount, updatedAt }`; backend JSON `{ amount: number | null }`. |
| `components/screens/insights-screen.tsx`       | Create        | `'use client'`. Composes `SummaryBlock`/`ComparisonBlock`/`WeeklyBudgetBlock` (presentational, same file). Reads hooks, passes data via props.                                                                                                                                                                          |
| `components/app-frame.tsx`                     | Modify        | Replace placeholder div (lines 207–211) with `<InsightsScreen />`.                                                                                                                                                                                                                                                      |
| `components/screens/dashboard-screen.tsx`      | Modify        | Remove "Comparativa mensual próximamente" + "Presupuesto semanal próximamente"; add a link to `#/insights`.                                                                                                                                                                                                             |
| `lib/insights.test.ts`                         | Modify        | Cover `computeComparison` + `getWeekExpenses` (both-months, prev-empty, equal, Monday boundary).                                                                                                                                                                                                                        |
| `lib/weekly-budget.test.ts`                    | Create        | Mock `localStorage`; per-user keys, JSON shape, missing/invalid JSON fallback, set/clear.                                                                                                                                                                                                                               |
| `components/screens/insights-screen.test.tsx`  | Create        | Mock `./store`, `./insights` (useDashboardStats), `./weekly-budget`; assert 3 blocks, empty states, no "próximamente".                                                                                                                                                                                                  |
| `components/screens/dashboard-screen.test.tsx` | Modify        | Update assertion from "próximamente" to a navigation link to `#/insights`.                                                                                                                                                                                                                                              |

## Interfaces / Contracts

```ts
export interface Comparison {
  currentMonthTotal: number
  previousMonthTotal: number
  absoluteDelta: number
  percentageDelta: number | null // null when previousMonthTotal === 0
  direction: 'current-higher' | 'current-lower' | 'equal'
  currentMonthLabel: string
  previousMonthLabel: string
  hasPreviousData: boolean
}

// lib/weekly-budget.ts
export interface WeeklyBudget {
  amount: number
  updatedAt: string
}
export interface WeeklyBudgetRepository {
  read(email: string): Promise<WeeklyBudget | null>
  write(email: string, amount: number): Promise<WeeklyBudget | null>
  clear(email: string): Promise<WeeklyBudget | null>
}
export function weeklyBudgetKey(email: string): string // `budgeting_weekly_budget_${email}`
export function readWeeklyBudget(email: string): WeeklyBudget | null
export function writeWeeklyBudget(email: string, amount: number): void
export const localStorageWeeklyBudgetRepository: WeeklyBudgetRepository
export const backendWeeklyBudgetRepository: WeeklyBudgetRepository
export function createWeeklyBudgetRepository(
  flag?: string,
): WeeklyBudgetRepository
export function useWeeklyBudget(email: string): {
  budget: WeeklyBudget | null
  setAmount: (amount: number) => void
  clear: () => void
}
```

## Testing Strategy

| Layer       | What                                                                                                                       | Approach                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Unit        | `computeComparison`, `getWeekExpenses` (Mon boundary, prev-empty → percentage null)                                        | Pure fn tests in `lib/insights.test.ts`                                      |
| Unit        | `readWeeklyBudget`/`writeWeeklyBudget` per-user namespaces, invalid JSON                                                   | Mock `localStorage` in `lib/weekly-budget.test.ts`                           |
| Unit        | Repository seam selection, backend default, local fallback, and backend adapter contract (`GET`, `PUT`, CSRF, `0`, `null`) | Mock `fetch`, cookie, and fallback flag input in `lib/weekly-budget.test.ts` |
| Component   | Three blocks render, empty states, no "próximamente"                                                                       | RTL + vi.mock of store/insights/weekly-budget                                |
| Integration | Dashboard links to `#/insights`                                                                                            | Update `dashboard-screen.test.tsx`                                           |
| A11y        | Headings, native `<form>/<button>`, field labels, focus-visible                                                            | Manual + existing Lighthouse pass                                            |

## Migration / Rollout

No backend migration in this frontend change. Backend mode is active by default because the backend `persist-weekly-budget` change is implemented and verified; localStorage remains available only as a fallback with `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`. Rollback = revert new files + edits or temporarily set the fallback flag; orphaned `localStorage` keys are harmless. Forecast: original implementation exceeded review budget and was accepted under maintainer-approved `size:exception`; this amendment is a narrow seam update inside the same change.

## Open Questions

- [ ] `email` is the only per-user key segment — acceptable for MVP; spec uses `{userEmail}` literally (no sanitization needed; localStorage tolerates `@`/`.`).
- [x] **AGENTS.md is stale**: claims categories are a closed enum `'Supermercado' | 'Farmacia' | 'Auto'`, auth is "mocked in client state", and Section is `'capturar' | 'inicio' | 'historial'`. Reality: `lib/types.ts` has 18 categories; `lib/auth.tsx` calls real backend `/auth/me`; `app-frame.tsx` Section already includes `'insights'`. Per proposal, full cleanup is out of scope; implementer MUST follow `lib/types.ts` `CATEGORIES` + `lib/auth.tsx`, NOT the AGENTS.md description. Defer AGENTS.md/doc cleanup to a separate change.
- [x] Backend weekly-budget contract is locked by backend change `persist-weekly-budget`: `GET/PUT /auth/me/weekly-budget`, `{ amount: number | null }`, `0` valid, `null` unset, CSRF header required on `PUT`.

## Next Step

Ready for `sdd-tasks` (split into chained PRs given review-budget pressure).
