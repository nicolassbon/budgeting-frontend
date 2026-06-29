# Proposal: Connect Transactions to Spring Boot Backend

## Intent

Migrate the frontend expense/transaction storage from client-side `localStorage` to the Spring Boot backend transactions API. This connects the creation and retrieval of expenses to `/transactions/*` endpoints, integrates CSRF security tokens, handles unit conversion between pesos and cents, and updates the local state management and test suite.

## Scope

### In Scope

- **Repository Migration**: Remove [seedExpenses](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx#L25) and [LocalStorageExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx#L100) from [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx).
- **HttpExpenseRepository**: Create [HttpExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) implementing the [ExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx#L93) interface.
- **Concurrent Fetching**: Implement `fetchExpenses()` to concurrently retrieve transactions from `/transactions/GROCERIES`, `/transactions/PHARMA`, and `/transactions/AUTO` using `Promise.all`.
- **Unit & Property Mapping**:
  - Divide backend amounts (in cents/centavos) by `100` to convert to frontend pesos.
  - Assign a fallback ISO date (`new Date().toISOString()`) for retrieved expenses since the backend does not persist transaction dates.
  - Map numerical backend transaction `id` values to string `id` values for the frontend.
- **Transaction Creation**: Implement `createExpense(expense)` to send a `POST /transactions` request with body `{ description, category, amount: Math.round(amount * 100) }`.
- **CSRF Protection**: Attach the `X-XSRF-TOKEN` header on mutation requests (`POST /transactions`) extracted from cookies.
- **No-Op Interface Compliance**: Implement resolved promises (no-ops) for `updateExpense(id, updates)` and `deleteExpense(id)` to fulfill the [ExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx#L93) interface constraints.
- **Test Suite Adaptation**: Rewrite [store.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.test.ts) to mock global fetch calls instead of asserting against `localStorage`.

### Out of Scope

- Backend implementation of transaction updates (`PUT`) or deletions (`DELETE`).
- Updating the UI to remove edit/delete triggers or change existing user workflows.

## Capabilities

### New Capabilities

- **Persistent Backend Transactions**: Expenses are fetched from and written directly to the backend database via the Spring Boot transactions API.
- **CSRF Token Validation**: Expense creation calls are secured with `X-XSRF-TOKEN` request headers.

### Modified Capabilities

- **Concurrent Category Retrieval**: Category-based endpoints are requested concurrently rather than reading a unified localStorage array.
- **Temporary Mock Updates/Deletes**: Modifying or removing transactions resolves cleanly in the frontend store interface but does not persist updates to the backend (no-ops).

## Approach

### 1. Dev Proxy Configuration

Verify or leverage the existing `rewrites` configuration block in [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) which routes `/transactions/:path*` to `http://localhost:8080/transactions/:path*`.

### 2. Implement HttpExpenseRepository

Implement the [HttpExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) class in [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx):

- **Helper for CSRF**: Re-use or write a utility function to extract the `XSRF-TOKEN` cookie:
  ```typescript
  function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  }
  ```
- **fetchExpenses()**:
  - Perform `Promise.all` fetch calls to `/transactions/GROCERIES`, `/transactions/PHARMA`, and `/transactions/AUTO`.
  - Check `response.ok` for all requests.
  - Flatten the returned arrays.
  - Map each item from the backend format `{ id: number, description: string, amount: number, category: string }` to the frontend [Expense](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/types.ts#L15) interface:
    - `id`: Convert numerical ID to string (`id.toString()`).
    - `amount`: Divide centavos by 100 (`amount / 100`).
    - `date`: Assign `new Date().toISOString()` as a fallback.
- **createExpense(input)**:
  - Submit a `POST /transactions` call with JSON body:
    ```json
    {
      "description": input.description,
      "category": input.category,
      "amount": Math.round(input.amount * 100)
    }
    ```
  - Attach headers `'Content-Type': 'application/json'` and `'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''`.
  - Validate response and map the returned backend transaction back to the frontend [Expense](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/types.ts#L15) format.
- **updateExpense(id, updates)** & **deleteExpense(id)**:
  - Return resolved Promises (e.g. `Promise.resolve(...)`).

### 3. StoreProvider Wiring

Update [StoreProvider](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx#L208) to use [HttpExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) instead of `LocalStorageExpenseRepository`.

### 4. Test Suite Refactoring

Refactor [store.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.test.ts) to:

- Spy or mock the global `fetch` function in Vitest.
- Mock concurrent successful responses from `/transactions/GROCERIES`, `/transactions/PHARMA`, and `/transactions/AUTO`.
- Assert that [HttpExpenseRepository](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) maps the fields properly (e.g. cents to pesos conversion, id string conversion, fallback dates).
- Mock successful POST responses for `/transactions` and check that the body contains the rounded amount in centavos and includes the `X-XSRF-TOKEN` header.

## Affected Areas

| Area                                                                                                   | Impact   | Description                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx)         | Modified | Remove localStorage logic and seed fixture data. Implement HttpExpenseRepository with API calls and data transformation, then instantiate it in the provider. |
| [store.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.test.ts) | Modified | Refactor tests from localStorage verification to network mocking (Vitest global mock fetch), checking payload and mapping accuracy.                           |

## Risks

| Risk                                   | Likelihood | Mitigation                                                                                                                                                                                                                                                                       |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Missing CSRF Token on Expense Post** | Medium     | Ensure authentication flow initializes CSRF tokens before adding transactions, or handle authorization/CSRF cookie injection correctly via session setup.                                                                                                                        |
| **Unstable Dates on Reload**           | High       | Since backend does not persist transaction dates, the fallback date (`new Date().toISOString()`) will cause all expenses to show the current time on refresh. This is an accepted limitation of the MVP backend design, but the frontend should gracefully sort or display them. |
| **Simultaneous Request Failures**      | Low        | Implement robust error logging inside the Promise.all fetch blocks to ensure a failure in one category retrieval doesn't silently break everything without visibility.                                                                                                           |

## Rollback Plan

- Revert changes to [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) and [store.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.test.ts) using Git to restore local storage capabilities.

## Dependencies

- Backend Spring Boot transaction endpoints (`GET /transactions/{category}`, `POST /transactions`) running on `http://localhost:8080`.
- Authentication flow establishing the CSRF cookie prior to mutation requests.

## Success Criteria

- [ ] Code compiles under `pnpm exec tsc --noEmit` without type errors.
- [ ] ESLint check (`pnpm lint`) and Prettier formatting (`pnpm format:check`) pass.
- [ ] `pnpm test` executes all unit tests successfully, confirming correct mapping and network call parameters.
- [ ] Manual test verifies that creating a transaction correctly hits the next-dev server rewrite proxy.
