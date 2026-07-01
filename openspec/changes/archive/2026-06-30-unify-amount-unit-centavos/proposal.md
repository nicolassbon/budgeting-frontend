# Proposal: Unify Amount Unit on Centavos (Frontend)

## Intent

Adapt the frontend to the unified transaction amount unit (integer centavos) on the backend. The backend AI draft endpoint `/transactions/interpret` now returns amounts in integer centavos instead of pesos. To integrate with this change without affecting the rest of the application, we will divide the returned amount by 100 on the AI interpretation layer (`HttpCaptureService.interpretText` in `lib/format.ts`). This restores the draft preview amount to ARS pesos, which matches the unit expected by the local UI, validation rules, and the mock store (`lib/store.tsx` still handles saving by multiplying pesos by 100). The corresponding unit tests (`lib/format.test.ts` and `components/screens/capture-screen.test.tsx`) must also be aligned to expect centavos in network-level mocks.

## Proposal questions

1. **Should the client-side parsing regex (`interpretExpense`) be changed?**
   - _Assumption_: No. `interpretExpense` is a local client-side heuristic for offline/fallback parsing, and its output is immediately shown in the UI draft preview (which is in pesos). It does not interact with the backend API and should continue to parse values as pesos.
2. **Do other screens/endpoints need amount conversion?**
   - _Assumption_: No. The transaction list/history endpoints (`GET /transactions`) and category totals already return amounts in centavos, and `HttpExpenseRepository` already divides them by 100 when loading. This change focuses exclusively on adapting the AI draft endpoint `/transactions/interpret`.

## Scope

### In Scope

- Modify `HttpCaptureService.interpretText` in [lib/format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts) to divide the returned transaction `amount` by 100 when it is present.
- Update network-level mock assertions in [lib/format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts) to return amounts in centavos (e.g. `350000` centavos instead of `3500` pesos) in `/transactions/interpret` mock responses.
- Update network-level mock assertions in [components/screens/capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) to return `7000000` (representing $70,000 in centavos) in mock responses for the same endpoint.

### Out of Scope

- Modifying `interpretExpense` local parsing function.
- Changing Flyway or database schemas (backend concern, already done).
- Changing persistence logic in [lib/store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx).

## Capabilities

### Modified Capabilities

- **Transaction AI Capture**: The `/transactions/interpret` client-side service correctly processes transaction amounts returned in centavos and presents them as pesos in the draft view. This change affects the live specification at [openspec/specs/user-transactions/nlp-spec.md](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/openspec/specs/user-transactions/nlp-spec.md). The changes (deltas) will be merged in-place into that live spec file upon archive.

No new capabilities are added, and no existing capabilities are removed.

## Approach

We will use strict Test-Driven Development (TDD):

1. **Red Stage**: Update the test mocks in `lib/format.test.ts` and `components/screens/capture-screen.test.tsx` to return the new centavos format. Run `pnpm test` to verify they fail because the frontend is not dividing by 100 (which will cause the draft amounts to be 100x larger than expected).
2. **Green Stage**: Modify `HttpCaptureService.interpretText` in `lib/format.ts` to divide the `amount` by 100. Run the tests again to ensure they pass.
3. **Refactor Stage**: Run ESLint and Prettier (`pnpm format:check`, `pnpm lint`) and run a full production build (`pnpm build`) to verify TypeScript type-correctness and production-readiness.

## Affected Areas

| Area                                                                                                                                                         | Impact   | Description                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| [lib/format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts)                                                           | Modified | In `HttpCaptureService.interpretText`, divide `data.amount` by 100 if present. |
| [lib/format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts)                                                 | Modified | Update mock response amount to `350000` centavos instead of `3500` pesos.      |
| [components/screens/capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) | Modified | Update mock response amount to `7000000` centavos instead of `70000` pesos.    |

## Risks and Mitigations

| Risk                                                                                                                                                                                 | Likelihood | Mitigation                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **100x Scaling Mismatch Risk**: Failing to divide by 100 or doing it twice, leading to entries being saved with inflated or deflated amounts (e.g. saving $3,500.00 as $350,000.00). | Medium     | Explicit unit tests at both the unit level (`lib/format.test.ts`) and screen/integration level (`components/screens/capture-screen.test.tsx`) asserting the correct conversion. |
| **Out-of-sync backend and frontend deployments**: If backend is deployed with centavos return but frontend doesn't divide, user drafts will display 100x larger.                     | High       | Deploy backend and frontend changes together (coordinated release).                                                                                                             |

## Rollback Plan

If issues arise, revert the commits. The change is entirely stateless on the frontend and does not affect localStorage or local state shapes. Reverting the code changes in `lib/format.ts` and updating test mocks back to pesos will restore the previous behavior.

## Dependencies

- Coordinated backend change `unify-amount-unit-centavos` (already implemented and verified).
- Both packages must be built and shipped in a single release cycle to avoid mismatches.

## Success Criteria

- [ ] `HttpCaptureService.interpretText` divides the non-null/non-undefined backend amount by 100.
- [ ] `lib/format.test.ts` mock response uses centavos and verifies that the returned draft amount is in pesos.
- [ ] `components/screens/capture-screen.test.tsx` mock response uses centavos and verifies that the draft view displays and submits the correct peso amount.
- [ ] `pnpm test` passes successfully.
- [ ] `pnpm lint` and `pnpm format:check` pass successfully.
- [ ] `pnpm build` succeeds without compilation errors.
