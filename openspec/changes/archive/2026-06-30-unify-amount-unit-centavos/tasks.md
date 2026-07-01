# Tasks: Unify Amount Unit on Centavos (Frontend)

## Review Workload Forecast

- **Estimated lines changed**: ~20-30 lines across 3 files.
- **Chained PRs recommended**: No (the `single-pr` strategy was selected in the preflight interactive choice of the current session).
- **400-line budget risk**: Low.
- **Decision needed before apply**: No (strategy is locked to `single-pr` per user session preferences).

## Step-by-Step TDD Cycles

### Phase 1: Test Red Stage (Verify Failures)

- [x] **Task 1.1**: Update the mock response amount in [format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts) to return `350000` centavos instead of `3500` pesos.
  - File: [format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts)
  - Details: In the [HttpCaptureService.interpretText](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts) unit test block, update the mock JSON response of the mock fetch to return `"amount": 350000`.
- [x] **Task 1.2**: Update the mock response amount in [capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) to return `7000000` centavos instead of `70000` pesos.
  - File: [capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx)
  - Details: In the integration tests block, update the mocked response of the `/transactions/interpret` endpoint to return `"amount": 7000000`.
- [x] **Task 1.3**: Run the test suite and verify that both test suites fail.
  - Command: `pnpm test lib/format.test.ts components/screens/capture-screen.test.tsx`
  - Expected failures: [HttpCaptureService.interpretText](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts) unit test expects `3500` but receives `350000`, and `CaptureScreen` integration test expects `70000` but receives `7000000` in the form values or UI draft preview.

### Phase 2: Implementation Green Stage (Implement Conversion)

- [x] **Task 2.1**: Implement the division by 100 in [HttpCaptureService.interpretText](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts).
  - File: [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts)
  - Details: In [HttpCaptureService.interpretText](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts), locate where `amount` is mapped from the backend response `data.amount` and convert from centavos to pesos:
    ```typescript
    const amount =
      data.amount !== null && data.amount !== undefined
        ? data.amount / 100
        : null
    ```
- [x] **Task 2.2**: Run the test suite and verify all tests pass.
  - Command: `pnpm test`
  - Expected: All tests, including the updated tests in Phase 1, pass.

### Phase 3: Refactor / Quality Checks (Production Readiness)

- [x] **Task 3.1**: Check code formatting.
  - Command: `pnpm format:check`
- [x] **Task 3.2**: Run linter checks.
  - Command: `pnpm lint`
- [x] **Task 3.3**: Perform TypeScript type checking.
  - Command: `pnpm exec tsc --noEmit`
- [x] **Task 3.4**: Build the application for production to ensure there are no compilation or bundling errors.
  - Command: `pnpm build`
- [x] **Task 3.5**: Author `openspec/changes/unify-amount-unit-centavos/apply-progress.md` containing the TDD Cycle Evidence table and verification outcomes before verification starts.
