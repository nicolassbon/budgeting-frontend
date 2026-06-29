# Tasks: Connect NLP Interpretation to Spring Boot Backend

Detailed implementation plan for migrating the client-side NLP capture mechanism to the Spring Boot backend interpretation API.

## Implementation Tasks

### Phase 1: Foundation

- [x] Verify that Next.js 15 routing proxy in [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) correctly proxies `/transactions/:path*` to `http://localhost:8080/transactions/:path*`.
- [x] Implement `getCookie` regex-based extraction utility in [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts).

### Phase 2: Core Implementation

- [x] Define `HttpCaptureService` implementing `CaptureService` in [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts).
  - [x] Configure `POST /transactions/interpret` call.
  - [x] Map CSRF header `X-XSRF-TOKEN` from the `XSRF-TOKEN` cookie value if present.
  - [x] Transform backend amount units (divide cents by `100` to convert to pesos).
  - [x] Map categories strictly to `'GROCERIES' | 'PHARMA' | 'AUTO'` (or fallback to `null` if unrecognized).
  - [x] Add basic response status checks and error propagation.
- [x] Export an instance of `HttpCaptureService` as `mockCaptureService` (renaming/replacing the client-side simulation instance in `format.ts`).

### Phase 3: Testing & Verification

- [x] Update [capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) integration tests.
  - [x] Stub the global `fetch` object with `vi.stubGlobal('fetch', ...)`.
  - [x] Verify successful async interpretation and visual representation of the draft.
  - [x] Verify error handling / offline fallback checks.
- [x] Extend [format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts) (or add `lib/capture-service.test.ts`) unit tests to isolate `HttpCaptureService`.
  - [x] Test payload formatting, headers verification, and cookie extraction.
  - [x] Test status code exceptions and category boundaries.
  - [x] Test cents-to-pesos value scaling.
- [x] Execute codebase verification suite:
  - [x] Format code check: `pnpm format:check`
  - [x] Linter check: `pnpm lint`
  - [x] Test execution: `pnpm test`
  - [x] TypeScript compilation: `pnpm exec tsc --noEmit`
  - [x] Production build check: `pnpm build`

---

## Changed Lines Forecast

- `lib/format.ts`: ~40-50 lines added or modified.
- `lib/format.test.ts`: ~30-40 lines added.
- `components/screens/capture-screen.test.tsx`: ~30-40 lines modified.

**Total Estimated Change**: ~100-130 lines.

---

## Commit & Testing Strategy

- **TDD Mode**: Recommended. Write the unit tests for `HttpCaptureService` inside `lib/format.test.ts` first, run `pnpm test` in watch mode, verify failure, then complete the implementation in `lib/format.ts` and verify success.
- **Commit Pattern**: Single feature commit complying with Conventional Commits:
  - `feat(capture): connect NLP interpretation to Spring Boot backend API`
