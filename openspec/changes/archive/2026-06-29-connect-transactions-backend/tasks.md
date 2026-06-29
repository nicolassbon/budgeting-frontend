# Tasks: Connect Transactions to Spring Boot Backend

## Plan Metadata

- **Estimated Changed Lines**: ~150 lines
- **Chain Strategy**: Phase-based atomic commits
- **Strict TDD Mode**: Enabled

---

## Tasks

### Phase 1: Foundation

- [x] Verify dev rewrites configuration in [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) to ensure `/transactions/:path*` is proxied to `http://localhost:8080/transactions/:path*`.
- [x] Run a production build check to establish a baseline:
  ```bash
  pnpm build
  ```

### Phase 2: Core Implementation

- [x] Add the `getCookie` utility function to [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) for cookie parsing.
- [x] Implement `HttpExpenseRepository` class in [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) conforming to `ExpenseRepository`.
  - [x] Implement concurrent category GET requests inside `fetchExpenses()` using `Promise.all`.
  - [x] Implement mapping and flattening of response payload (centavos to pesos, numerical ID to string, date fallback).
  - [x] Implement `createExpense()` sending POST request to `/transactions` with CSRF headers and payload amount in cents (`Math.round(amount * 100)`).
  - [x] Implement no-op methods for `updateExpense()` and `deleteExpense()`.
- [x] Update `StoreProvider` in [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx) to instantiate and use `HttpExpenseRepository` instead of `LocalStorageExpenseRepository`.

### Phase 3: Testing & Verification

- [x] Rewrite [store.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.test.ts) to stub global `fetch` via Vitest.
- [x] Add tests verifying concurrent categories fetch requests and data structure mapping (cents to pesos, id to string, ISO date fallback).
- [x] Add tests verifying expense creation POST payload conversion, headers (`Content-Type`, `X-XSRF-TOKEN`), and response mapping.
- [x] Add tests verifying immediate resolved resolves for no-op update and delete calls.
- [x] Execute the unit tests to confirm repository compliance:
  ```bash
  pnpm test
  ```
- [x] Run formatting, linting, type-checking, and build validation commands:
  ```bash
  pnpm format:check && pnpm lint && pnpm exec tsc --noEmit && pnpm build
  ```
