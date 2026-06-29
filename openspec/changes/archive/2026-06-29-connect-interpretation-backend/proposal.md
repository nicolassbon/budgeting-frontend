# Proposal: Connect NLP Interpretation to Spring Boot Backend

## Intent

Migrate the frontend natural language processing (NLP) interpretation mechanism from the current client-side local heuristic parser (`interpretExpense`) to the Spring Boot backend's NLP interpretation API (`POST /transactions/interpret`). This integrates remote interpretation capabilities, supports CSRF validation, maps backend amounts (centavos) to frontend amounts (pesos), and adapts the unit and integration tests.

## Scope

### In Scope

- **HttpCaptureService**: Implement `HttpCaptureService` implementing the [CaptureService](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts#L69) interface in [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts).
- **Interpretation API Call**:
  - Perform a `POST /transactions/interpret` HTTP request with JSON body `{"prompt": rawText}` inside `interpretText(rawText)`.
  - Extract the `XSRF-TOKEN` cookie (using a cookie helper matching the implementation in [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx#L15)) and inject it as the `X-XSRF-TOKEN` header.
  - Check `response.ok` and throw an error on unsuccessful HTTP statuses.
- **NLP Response Parsing & Mapping**:
  - Parse the JSON response structure: `{"description": string, "amount": number | null, "category": string | null}`.
  - Scale the `amount` property from centavos (backend format) to pesos (frontend format) by dividing by `100` if the amount is not null.
  - Safely validate and map the category string to the frontend [Category](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/types.ts#L1) type or `null` if the value is missing or invalid.
- **Service Integration**: Replace the exported `mockCaptureService` instance in [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts#L109) with an instance of `HttpCaptureService` to seamlessly update all downstream usages (such as in [capture-screen.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.tsx#L81)).
- **Test Alignment**:
  - Update [capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) to stub the global `fetch` call for NLP interpretations, ensuring integration tests continue passing.
  - Extend [format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts) (or create `lib/capture-service.test.ts`) to isolate and test `HttpCaptureService`, verifying headers, JSON payloads, cookie extraction, and responses.

### Out of Scope

- Implementing voice-to-text dictation on the backend (the Web Speech API remains client-side).
- Persisting parsed transactions immediately without user confirmation (the frontend draft preview remains mandatory).
- Changing backend Spring Boot NLP logic or endpoint routing.

## Capabilities

### New Capabilities

- **Remote NLP Interpretation**: Natural language queries are processed by the Spring Boot backend instead of relying on frontend-only regular expression heuristics.
- **Secure NLP Requests**: Interpretation calls are authenticated and protected against CSRF via the `X-XSRF-TOKEN` header.

### Modified Capabilities

- **Data Unit Translation**: Backend centavos are scaled to frontend pesos during the preview generation stage.
- **Error Propagation**: Unsuccessful NLP requests are caught and surfaced via user feedback, prompting manual fallback input if the API is offline.

## Approach

### 1. Dev Proxy Verification

Confirm that Next.js 15 dev rewrites inside [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) correctly map `/transactions/interpret` to `http://localhost:8080/transactions/interpret`. No next config changes are needed since `/transactions/:path*` is already mapped to the backend.

### 2. Implement HttpCaptureService in `lib/format.ts`

- Add `getCookie` regex-based utility in [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts):
  ```typescript
  function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  }
  ```
- Define `HttpCaptureService` class implementing `CaptureService`:

  ```typescript
  export class HttpCaptureService implements CaptureService {
    async interpretText(rawText: string): Promise<Interpretation> {
      const csrfToken = getCookie('XSRF-TOKEN')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken
      }

      const response = await fetch('/transactions/interpret', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: rawText }),
      })

      if (!response.ok) {
        throw new Error(`NLP interpretation failed: status ${response.status}`)
      }

      const data = await response.json()

      let category: Category | null = null
      if (
        data.category === 'GROCERIES' ||
        data.category === 'PHARMA' ||
        data.category === 'AUTO'
      ) {
        category = data.category
      }

      return {
        description: data.description || rawText,
        amount:
          data.amount !== null && data.amount !== undefined
            ? data.amount / 100
            : null,
        category,
      }
    }
  }
  ```

- Replace the export of `mockCaptureService` with an instance of `HttpCaptureService`:
  ```typescript
  export const mockCaptureService: CaptureService = new HttpCaptureService()
  ```

### 3. Refactor Integration & Unit Tests

- **Integration test** ([capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx)):
  - Inject a global fetch stub using `vi.stubGlobal('fetch', mockFetch)`.
  - Simulate successful and failed backend NLP requests to verify the draft preview displays appropriate values.
- **Unit test** ([format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts) or a dedicated file):
  - Stub global `fetch` and verify that the request payload is structured properly: `{"prompt": "some text"}`.
  - Assert that `X-XSRF-TOKEN` is correctly extracted from `document.cookie` and sent as a header.
  - Verify mapping logic handles null values, valid categories, and converts centavos to pesos (e.g., `7000000` centavos to `70000` pesos).

## Affected Areas

| Area                                                                                                                                      | Impact   | Description                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts)                                            | Modified | Implement `HttpCaptureService`, include cookie helper, and replace the `mockCaptureService` export instance.    |
| [capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) | Modified | Add global `fetch` stubbing in tests to support asynchronous network interpretation logic.                      |
| [format.test.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.test.ts)                                  | Modified | Add unit tests to isolate the `HttpCaptureService` HTTP request structure, cookie checks, and response parsing. |

## Risks

| Risk                         | Likelihood | Mitigation                                                                                                                                        |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Missing CSRF Token**       | Medium     | Ensure token check fallback is implemented; log warnings if the cookie is missing and proceed gracefully if the backend allows public NLP checks. |
| **NLP Backend Down/Timeout** | Medium     | Catch promise rejections in `CaptureScreen` and log errors. The UI already has a "Prefiero cargarlo a mano" option for manual entry.              |
| **Invalid Category Mapping** | Low        | Explicitly map response category strings to the closed `Category` union type, falling back to `null` if the backend returns unknown categories.   |

## Rollback Plan

- Revert the changes to `format.ts`, `capture-screen.test.tsx`, and `format.test.ts` using Git to restore local heuristic parsing.

## Dependencies

- Spring Boot Backend transaction interpreter running on `http://localhost:8080/transactions/interpret`.
- CSRF cookie initialization from prior authentication steps.

## Success Criteria

- [ ] Strict type checking (`pnpm exec tsc --noEmit`) compiles successfully.
- [ ] ESLint rules (`pnpm lint`) and Prettier formatting (`pnpm format:check`) pass cleanly.
- [ ] Vitest unit and integration tests (`pnpm test`) run and pass successfully.
- [ ] Integration checks verify that `HttpCaptureService` makes requests containing valid `X-XSRF-TOKEN` headers and converts backend amount units (cents) correctly.
