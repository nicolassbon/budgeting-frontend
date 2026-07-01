## Exploration: MVP Insights, Comparativa mensual, Presupuesto semanal

### Current State

The frontend is a single-page shell (`app/page.tsx` → `components/budgeting-app.tsx` → `components/app-frame.tsx`) with three sections currently routed by hash anchors: `#/inicio` (dashboard), `#/historial` (history), `#/insights` (placeholder). Capture happens through a global floating `CaptureConsole` (modal, not a section) triggered by a button or `⌘/Ctrl+K`.

Real backend is already wired across the app:

- `lib/auth.tsx` calls `/auth/{me,login,register,logout}`.
- `lib/store.tsx` uses `HttpExpenseRepository` against `/transactions` (GET, POST, PUT `/{id}`) and converts centavos→pesos.
- `lib/format.ts` exposes `HttpCaptureService` against `POST /transactions/interpret`.
- `lib/insights.ts` already calls `GET /dashboard/spending` and exposes `useDashboardStats` returning `MonthStats` (total, count, average, breakdown, topCategory, monthLabel). The helper `mapDashboardSummaryToMonthStats` consumes the backend `DashboardSummaryResponse` (`period`, `totalAmountCents`, `transactionCount`, `topCategories[]`) shape.

The two MUST-HAVE placeholders already exist on the dashboard:

- Dashboard "Total Gastado" card contains the chip "Comparativa mensual próximamente".
- Dashboard "Categoría destacada" card contains the line "Presupuesto semanal próximamente.".
- AppFrame `section === 'insights'` renders the dashed placeholder "Insights próximamente".

The backend has the following relevant surface today (verified by reading `infraestructure/http/*` and the `dashboard-spending-metrics` spec):

- `GET /dashboard/spending` — current month only (`DashboardService.currentMonthSummary`). Returns the period bounds in `period.{from,to}`. No previous-month field, no weekly bucket, no budget concept, no goals.
- `GET /transactions?from=YYYY-MM-DD&to=YYYY-MM-DD&category=...` — supports arbitrary date-range filtering. This is the only way to retrieve prior-month aggregates without backend work.
- `dio.budgeting.domain` exposes `Category`, `Transaction`, `TransactionRepository`. There is no `Budget`, `WeeklyBudget`, or `MonthlyComparison` aggregate.
- Backend `openspec/changes` is fully archived (most recent `2026-07-01-harden-ai-interpretation`); no active backend change is in progress.

The frontend OpenSpec specs are partly stale and should NOT be used as authoritative for these features:

- `openspec/specs/integration-seams/spec.md` describes the old localStorage `AuthProvider` (replaced by real backend calls).
- `openspec/specs/user-transactions/spec.md` describes the 3-category era and `/transactions/{GROCERIES,PHARMA,AUTO}` fan-out (replaced by 18 categories and a single `GET /transactions`).
- `openspec/specs/user-transactions/nlp-spec.md` and `user-auth/spec.md` are still accurate.

`AGENTS.md` is materially out of date (see "AGENTS.md contradictions" section below). For navigation today, the truthful file map is:

- Active screens: `components/screens/dashboard-screen.tsx`, `components/screens/history-screen.tsx` (and a new `insights-screen.tsx` will be added).
- Active capture: `components/capture-console.tsx` (modal). `components/screens/capture-screen.tsx` exists but is no longer mounted.
- Active section union: `'inicio' | 'historial' | 'insights'` in `components/app-frame.tsx`.

### Affected Areas

- `components/app-frame.tsx` — section switch: replace the `'insights'` placeholder branch with `<InsightsScreen />`. Section union in `Section` type stays the same.
- `components/screens/` — new `insights-screen.tsx` (the home for all three features) with internal sub-blocks for monthly comparison and weekly budget.
- `components/screens/dashboard-screen.tsx` — drop the two "próximamente" chips and (optionally) surface the comparison and weekly budget as small link cards pointing at the new Insights section, or keep them on the dashboard and add a link. Strongly recommend linking to the dedicated Insights section to keep dashboard scannable.
- `lib/insights.ts` — add pure helpers next to `computeMonthStats`:
  - `computeMonthOverMonth(current, previous) => { currentTotal, previousTotal, deltaAbs, deltaPct, direction }`.
  - `getCurrentWeekExpenses(expenses, ref = new Date()) => Expense[]` (ISO week, locale-stable using `Intl.DateTimeFormat` or a simple Monday-anchored slice).
  - `computeWeeklyBudgetState(expenses, budgetAmount, ref = new Date()) => { spent, remaining, percentUsed, weekLabel, dayIndex, daysInWeek }`.
  - `usePreviousMonthStats()` returning `MonthStats` for the previous calendar month.
  - `useWeekExpenses()` returning current-week expenses.
- `lib/types.ts` — add a small `WeeklyBudget` type (`{ amount: number; updatedAt: string }`) and a storage helper in a new `lib/weekly-budget.ts` that reads/writes `localStorage` under a namespaced key.
- `lib/insights.test.ts` — add unit tests for the three new helpers (no fetch, pure).
- `components/screens/insights-screen.test.tsx` — new test file covering the three blocks (renders current/previous totals, renders weekly progress, renders empty state when budget is unset).
- `openspec/specs/integration-seams/spec.md` and `openspec/specs/user-transactions/spec.md` — out of scope for this change but flagged in `AGENTS.md` follow-up.
- `AGENTS.md` — out of scope for this change; the contradictions need a separate doc-cleanup change because the file is large and not in the review-budget for a feature PR.

### Approaches

Three independent features, each with two approaches.

1. **Insights section** (replace "Insights próximamente" placeholder).
   - **Option A — Reuse existing `useDashboardStats` and shape it as a dedicated page.** A new `InsightsScreen` that re-uses the current-month `MonthStats` plus the per-category `breakdown` to render: total/count/average, top-3 categories with share, full sorted breakdown with bars. All data already comes from `GET /dashboard/spending`. No backend changes. ~150 LOC. Pros: smallest diff, no new endpoints, fits the Linear-inspired design system. Cons: same data as the dashboard hero; "Insights" risk feeling like a duplicate view.
   - **Option B — Build a backend `/insights` endpoint with derived rules.** Out of scope for the MVP and would require backend work. Not recommended today.
   - **Recommendation: Option A**, but mitigate the "duplicate of dashboard" perception by anchoring Insights on the two new data points below (comparison + budget) and showing the breakdown list as the third block.

2. **Comparativa mensual** (replace the "Comparativa mensual próximamente" chip in the Total Gastado card, and surface on Insights).
   - **Option A — Client-side: two `GET /transactions?from=…&to=…` calls for current and previous month, then `computeMonthOverMonth` on the client.** No backend changes. ~120 LOC + tests. Pros: zero backend coupling, the transactions endpoint already supports date filtering. Cons: two round-trips, fetches full transaction lists (frontend already keeps them in `useStore().expenses`, so this can be done entirely from the store without new network calls — even cheaper).
   - **Option B — Backend endpoint `GET /dashboard/spending/comparison?from=…&to=…` returning both periods.** Cleaner API, less client work. Cons: new endpoint, new tests, new spec, requires backend worktree coordination and bumps the PR review budget.
   - **Recommendation: Option A** for MVP. The store already holds every transaction the user owns (`useStore().expenses`), so `usePreviousMonthStats` can be a pure selector that filters by `previousMonth` and reuses `computeMonthStats`. This makes the feature free at the network layer.

3. **Presupuesto semanal** (replace the "Presupuesto semanal próximamente" line in the Categoría destacada card, and surface on Insights).
   - **Option A — Client-side only with `localStorage`.** User sets a weekly budget amount; the UI shows spent/remaining/% for the current ISO week using `useWeekExpenses()`. Persisted under `localStorage` (key namespaced by user email). ~100 LOC. Pros: ships today, no schema migration. Cons: not synced across devices; per-user, not per-family.
   - **Option B — Backend `WeeklyBudget` resource (PUT/GET `/budgets/weekly`).** Synced, multi-device. Cons: new domain aggregate, new Flyway migration, new tests on both sides. Heavy for an MVP.
   - **Recommendation: Option A** for MVP. Document the local-only persistence in the proposal so the team is explicit that this is the MVP shape and the backend resource is a v2.

### Recommendation

Single OpenSpec change: `mvp-insights-comparison-budget` covering all three features because (a) they share the same home (a new `InsightsScreen`), (b) they share the same helper module additions, and (c) the review budget for the combined work is estimated at ~550-700 LOC plus tests, which can fit in a single PR if the team agrees, OR can be split into chained PRs (Insights skeleton → Comparativa → Presupuesto) if reviewer workload is a concern (forecast: medium risk against the 400-line default).

Concrete shippable shape:

- Add `components/screens/insights-screen.tsx` with three sections:
  1. "Tu mes" — current-month summary card (reuses `useDashboardStats`).
  2. "Comparativa mensual" — current vs previous month total, delta with up/down arrow and percentage. Empty state when previous month has zero data. Pure client-side from `useStore().expenses`.
  3. "Presupuesto semanal" — input for amount, progress bar, "te quedan $X de $Y esta semana" message, and a small breakdown by category for the current week. Amount stored in `localStorage` under `budgeting_weekly_budget_{email}`.
- Wire the section in `app-frame.tsx`.
- Remove the two "próximamente" chips from `dashboard-screen.tsx` and add a "Ver Insights" link instead, so users discover the new section without us duplicating the data.
- Tests: extend `lib/insights.test.ts` with the three new pure helpers; add `components/screens/insights-screen.test.tsx`.

### Risks

- **AGENTS.md drift** — already present (see "AGENTS.md contradictions" section). A future agent following AGENTS.md will be misled. Out of scope for this change; flag a follow-up doc-cleanup change.
- **Per-device localStorage for weekly budget** — user expectation mismatch ("I set it on my laptop, why doesn't my phone have it?"). Mitigate with copy ("Vive en este navegador hasta que agreguemos sync").
- **Week boundary ambiguity** — es-AR users expect "semana" to mean Monday-Sunday or Sunday-Saturday depending on context. The PRD does not specify. Use ISO week (Monday) to match `Intl` and the dashboard's `getMonthExpenses` pattern, and document the choice in the spec.
- **Comparison when previous month has zero data** — the UI must say "Mes anterior sin movimientos" instead of showing a misleading "-100%". Add a guard in the helper.
- **Timezone drift between frontend and backend** — `lib/insights.ts` already sends a `Time-Zone` header to `/dashboard/spending`. The new helpers must consume the user's local timezone (not UTC) when slicing "this week" and "previous month" to stay consistent with the dashboard totals.
- **Stale `useStore().expenses`** — `StoreProvider` only refetches on mount/user change. The new comparison and weekly views should subscribe to `expenseMutationsVersion` (same pattern as `useDashboardStats`) so they refresh after `addExpense`. This is the dominant integration concern and is easy to miss.
- **Review budget** — combined PR ~550-700 LOC + tests. 400-line default budget will be exceeded. Recommend chained PRs (Insights skeleton + dashboard link → Comparativa → Presupuesto) or explicit `size:exception`. Forecast lines for `sdd-tasks`: `Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, `400-line budget risk: Medium-High`.
- **Backend worktree** — not needed for this MVP. If the team later chooses Option B for comparativa (server-side) or wants a real `WeeklyBudget` resource, a backend worktree is then advisable.

### AGENTS.md contradictions

The current `AGENTS.md` does not match the code on at least six hard points. This exploration flags them; fixing them is intentionally OUT of scope here because the doc-cleanup diff is large enough to exceed the review budget on its own.

1. **Auth is intentionally mocked in client state for MVP** — `lib/auth.tsx` is wired to `/auth/{me,login,register,logout}` and relies on Spring Security session cookies set by the backend.
2. **Store is in-memory mock state seeded with fixtures, not persisted, not backed by an API. Do not wire it to a real backend yet** — `lib/store.tsx` now uses `HttpExpenseRepository` against `/transactions` (GET, POST, PUT `/{id}`); no fixtures are seeded.
3. **Categories are a closed enum: 'Supermercado' | 'Farmacia' | 'Auto'** — `lib/types.ts` defines 18 categories (COMIDA, SUPERMERCADO, FARMACIA, ROPA, TRANSPORTE, VIVIENDA, HOGAR, SERVICIOS, ENTRETENIMIENTO, EDUCACION, SALUD, CUIDADO_PERSONAL, MASCOTAS, SUSCRIPCIONES, REGALOS, IMPUESTOS, DEUDAS, OTROS).
4. **`AppFrame` holds active section state ('capturar' | 'inicio' | 'historial')** — actual `Section = 'inicio' | 'historial' | 'insights'`. `capturar` was replaced by the floating `CaptureConsole` modal.
5. **`components/screens/{capture,dashboard,history}-screen.tsx`** — `capture-screen.tsx` still exists on disk but is no longer mounted; the active capture is `components/capture-console.tsx`.
6. **Section links use hash anchors (#/capturar, #/inicio, #/historial)** — actual anchors are `#/inicio`, `#/historial`, `#/insights`.

Two existing OpenSpec specs in `openspec/specs/` are also stale for the same reason (describe the pre-backend localStorage/3-category era): `integration-seams/spec.md` and `user-transactions/spec.md`. They are out of scope here, but should be updated in the doc-cleanup change.

### Ready for Proposal

Yes. The shape above is concrete and self-contained:

- One new screen, three new pure helpers, one new `localStorage`-backed type, two small dashboard tweaks, and tests.
- Zero backend changes required for the MVP.
- Backend worktree not needed today; advisable only if the team later wants a `/dashboard/spending/comparison` endpoint or a `/budgets/weekly` resource.
- Chained-PR strategy recommended for the apply phase because the combined change is forecast to be in the 550-700 LOC + tests range, which is above the 400-line default review budget.

The orchestrator should propose this as a single change (`mvp-insights-comparison-budget`) and let `sdd-tasks` split it into chained slices if the team wants to keep each PR under 400 lines.
