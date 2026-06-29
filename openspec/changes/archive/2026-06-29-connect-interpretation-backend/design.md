# Design: Connect NLP Interpretation to Spring Boot Backend

This document outlines the architectural and design decisions for migrating the natural language processing (NLP) interpretation mechanism from a client-side local heuristic parser to the remote backend service.

## 1. Component Architecture

The capture system utilizes a service-oriented approach to separate interpretation logic from component rendering.

```mermaid
graph TD
    A[CaptureScreen Component] -->|Calls interpretText| B[CaptureService Interface]
    B -->|Implemented by| C[HttpCaptureService]
    C -->|Uses helper| D[getCookie]
    C -->|Sends POST| E[/transactions/interpret]
```

### 1.1 CaptureService Interface

The existing `CaptureService` interface in [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts#L69) defines a single asynchronous method:

```typescript
export interface CaptureService {
  interpretText(rawText: string): Promise<Interpretation>
}
```

### 1.2 HttpCaptureService Implementation

We will implement `HttpCaptureService` inside `lib/format.ts`. This class:

1. Performs an HTTP `POST` to `/transactions/interpret`.
2. Extracted headers are appended, specifically the content type and the CSRF token.
3. Decodes the response body and translates units and categories.
4. Returns a promise resolving to an `Interpretation` object.

The instance of `HttpCaptureService` replaces the exported `mockCaptureService` placeholder in `lib/format.ts`, decoupling `CaptureScreen` from the underlying implementation changes.

---

## 2. Cookie Extraction & CSRF Header Mapping

To comply with backend security constraints, requests that mutate or execute business actions must provide CSRF token verification.

### 2.1 The `getCookie` Helper

A utility function `getCookie` is used to parse the browser's cookies:

```typescript
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}
```

This utility scans `document.cookie` using a regular expression. It returns the decoded value of the token or `null` if the cookie is not present or if executed in a non-browser environment (such as server-side rendering).

### 2.2 Header Forwarding

If `getCookie('XSRF-TOKEN')` returns a non-null string, the token value is assigned to the `X-XSRF-TOKEN` header of the fetch request:

```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}
const csrfToken = getCookie('XSRF-TOKEN')
if (csrfToken) {
  headers['X-XSRF-TOKEN'] = csrfToken
}
```

---

## 3. Data Transformation & Mapping

Data properties returned by the Spring Boot backend must be scaled and validated to match the frontend expectations.

### 3.1 Unit Conversion: Centavos to Pesos

The Spring Boot backend treats transactional values as integers representing centavos. The frontend displays and records expenses in full pesos.

- **Conversion Rule**: If the response `amount` is not `null` or `undefined`, the frontend divides it by `100` before returning it in the final `Interpretation` output.
- **Example**: An amount of `7000000` centavos in the JSON response is mapped to `70000` pesos.

### 3.2 Category Validation

The backend outputs category strings such as `GROCERIES`, `PHARMA`, and `AUTO`. The frontend is bound to the closed enum `Category` defined in `lib/types.ts`.

- **Validation Rule**: The service checks if the backend string exactly matches `'GROCERIES'`, `'PHARMA'`, or `'AUTO'`. If it matches, the string is assigned to the category field. If it does not match (or is null), the field is resolved to `null`, ensuring validation checks inside `CaptureScreen` catch the missing field and highlight it for the user.

---

## 4. Testing Strategy

The transition to a network-bound service requires updating the test suite to simulate asynchronous HTTP traffic without initiating actual server connections.

### 4.1 Vitest Global Fetch Stubbing

In [capture-screen.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.test.tsx) and unit tests, we will stub the global `fetch` API using Vitest's `vi.stubGlobal` utility.

#### Example Fetch Mock Setup:

```typescript
const mockFetch = vi.fn().mockImplementation((url, options) => {
  if (url === '/transactions/interpret') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          description: 'Supermercado Coto',
          amount: 3500000,
          category: 'GROCERIES',
        }),
    })
  }
  return Promise.reject(new Error('Unknown endpoint'))
})

// Active stubbing during tests
vi.stubGlobal('fetch', mockFetch)
```

### 4.2 Test Coverage Specifications

1. **HttpCaptureService Unit Tests (`lib/format.test.ts` or `lib/capture-service.test.ts`)**:
   - Assert `POST` payload is serialized correctly as `{"prompt": "text"}`.
   - Assert `X-XSRF-TOKEN` header is attached when the cookie is present, and absent when the cookie is missing.
   - Assert status error handling (e.g., non-2xx statuses throw appropriate errors).
   - Assert correct scaling of amounts (e.g. `3500000` centavos to `35000` pesos).
   - Assert category parsing maps invalid/unknown string values to `null`.
2. **Integration Tests (`components/screens/capture-screen.test.tsx`)**:
   - Assert that clicking "Interpretar gasto" fires the backend fetch call.
   - Assert that upon successful response, the UI displays the Draft Preview with correct mapped values.
   - Assert that failed requests are caught, allowing fallback to manual entry or letting the user type the transaction.
