# Spending Insights Specification

## Purpose

Define the behavior of the Insights section, month-over-month comparison, and weekly budget for the MVP. The weekly budget MUST use the verified backend contract by default and MUST retain the browser-local repository as an explicit degraded fallback.

## Requirements

### Requirement: Insights Section Surface

The system MUST render a dedicated Insights screen for the section `insights` (hash anchor `#/insights`) with three blocks in order: (1) current-month summary and breakdown (sourced from `useDashboardStats`), (2) monthly comparison, (3) weekly budget. Each block MUST render a heading and an empty state when its data is absent.

#### Scenario: Anchor renders the screen

- **Given** the user is authenticated
- **When** they navigate to `#/insights`
- **Then** the AppFrame renders the Insights screen

#### Scenario: Current month with no data

- **Given** the current month has no expenses
- **When** the Insights screen renders
- **Then** the first block shows an empty state inviting the user to record an expense

### Requirement: Monthly Comparison

The system MUST compute the difference between the current and previous calendar month totals using `useStore().expenses` only (no new network calls), classify the result as `current-higher`, `current-lower`, or `equal`, and display both totals, the absolute delta, the percentage delta, and a direction indicator. The comparison MUST refresh after any expense mutation by subscribing to the same signal consumed by `useDashboardStats`.

#### Scenario: Both months have data

- **Given** both months have expenses
- **When** the user views "Comparativa mensual"
- **Then** the system MUST show both totals, absolute delta, percentage delta, and a direction indicator

#### Scenario: Previous month has no data

- **Given** the previous month has zero expenses
- **When** the user views "Comparativa mensual"
- **Then** the system MUST show "Mes anterior sin movimientos"
- **And** MUST NOT display a misleading percentage such as "-100%"

### Requirement: Weekly Budget

The system MUST allow the user to set a non-negative integer weekly budget in pesos. By default, the value MUST be persisted through the backend `GET/PUT /auth/me/weekly-budget` contract using JSON `{ amount: number | null }`. The browser-local repository MUST remain available as a degraded fallback when `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`; in fallback mode, values MUST be persisted to `localStorage` under `budgeting_weekly_budget_{userEmail}` and JSON-encoded as `{ amount: number, updatedAt: ISO-8601 string }`. The weekly budget access MUST go through a repository/service seam that keeps the existing `useWeeklyBudget(email)` consumer API stable. "Current week" MUST be the ISO 8601 week starting on Monday in the user's local timezone, and all week and month boundaries MUST be computed in local time (not UTC) to match the dashboard totals. The budget view MUST refresh after any expense mutation.

#### Scenario: User sets a budget

- **Given** the user is authenticated
- **When** they enter a non-negative integer amount and confirm
- **Then** the system MUST persist the value through the active weekly budget repository
- **And** the "Presupuesto semanal" block MUST show spent, remaining, and percent-used

#### Scenario: Budget persists per user

- **Given** a budget was stored for the current user
- **When** the Insights screen reloads or a different user signs in
- **Then** the system MUST read and write only the active user's budget
- **And** other users' stored budgets MUST remain untouched

#### Scenario: Zero budget remains valid

- **Given** the user has saved a weekly budget amount of `0`
- **When** the weekly budget block renders with zero or nonzero weekly spending
- **Then** the system MUST render a finite percent-used value
- **And** MUST NOT render `NaN% usado` or `Infinity% usado`

#### Scenario: No budget set

- **Given** no budget is stored for the current user
- **When** the user views "Presupuesto semanal"
- **Then** the system MUST show an empty input and a prompt to set a budget

#### Scenario: Week starts on Monday in local time

- **Given** the user's local timezone
- **When** the helpers compute "current week" and "current month"
- **Then** boundaries MUST start on Monday in local time and match the dashboard totals

### Requirement: Dashboard Placeholder Removal

The system MUST remove the "Comparativa mensual próximamente" chip and the "Presupuesto semanal próximamente" line from the dashboard and MUST surface a link to `#/insights`.

#### Scenario: Dashboard links to Insights

- **Given** the dashboard is rendered
- **When** the user views the Total Gastado and Categoría destacada cards
- **Then** neither card contains the string "próximamente"
- **And** the dashboard MUST expose a link that navigates to `#/insights`

### Requirement: Backend Weekly Budget Adapter

The system MUST provide a backend repository implementation for the verified `persist-weekly-budget` backend contract. Backend mode MUST be the active default path. The repository MUST call `GET /auth/me/weekly-budget` to read and `PUT /auth/me/weekly-budget` to save or clear. Request and response bodies MUST use `{ amount: number | null }`, where `0` is a valid amount and `null` means unset. The `PUT` request MUST include `X-XSRF-TOKEN` using the existing auth cookie helper pattern.

#### Scenario: Default mode uses backend persistence

- **Given** no weekly-budget fallback flag is enabled
- **When** the user reads, writes, or clears a weekly budget
- **Then** the system MUST use `GET/PUT /auth/me/weekly-budget`

#### Scenario: Explicit fallback remains browser-local

- **Given** `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false`
- **When** the user reads, writes, or clears a weekly budget
- **Then** the system MUST use the existing per-user `localStorage` behavior
- **And** MUST NOT make weekly-budget network calls

#### Scenario: Backend mode reads nullable contract

- **Given** backend weekly-budget mode is enabled
- **When** the system reads the user's budget
- **Then** it MUST call `GET /auth/me/weekly-budget`
- **And** MUST map `{ amount: null }` to an unset budget

#### Scenario: Backend mode writes zero and clears null

- **Given** backend weekly-budget mode is enabled
- **When** the user saves `0` or clears the budget
- **Then** the system MUST send `PUT /auth/me/weekly-budget` with `{ amount: 0 }` or `{ amount: null }`
- **And** MUST include the `X-XSRF-TOKEN` header when the cookie is available

### Requirement: No Frontend-Owned Backend Changes

The system MUST NOT modify the backend worktree, introduce frontend-owned backend endpoints, schemas, or migrations. Insights spending data MUST continue to come from `useStore().expenses` and `useDashboardStats`. Weekly budget backend mode MUST use the already verified backend `persist-weekly-budget` contract by default. Informational; no scenario.
