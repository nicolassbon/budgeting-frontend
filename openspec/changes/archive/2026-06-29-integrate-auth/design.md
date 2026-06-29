# Design Document: Backend Authentication Integration

## Technical Approach

To allow the frontend running on `http://localhost:3000` to interact with the Spring Boot backend on `http://localhost:8080` without triggering CORS issues and to support automatic cookie handling, Next.js dev rewrites will be configured.

### Dev Proxy Configuration

In [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs), we will add a `rewrites` configuration block mapping the following path prefixes to the backend:

- `/auth/:path*` -> `http://localhost:8080/auth/:path*`
- `/transactions/:path*` -> `http://localhost:8080/transactions/:path*`
- `/api/:path*` -> `http://localhost:8080/api/:path*`

This encapsulates the API integration cleanly, keeping the client code clean of absolute backend host URL references.

---

## Architectural Decisions

### 1. Client-Side Fetch vs. Mock

- **Decision**: Replace `localStorage` simulation inside [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) with native asynchronous `fetch` calls.
- **Rationale**: The application is structured as a client-side shell (`BudgetingApp` is a client component root, and the hook is client-side only). Direct client-side `fetch` calls are appropriate. The mock implementation will be completely retired, except during testing where `fetch` is mocked.

### 2. Cookie-Based CSRF Token Extraction and Forwarding

- **Decision**: Read the `XSRF-TOKEN` cookie from `document.cookie` and attach it as the `X-XSRF-TOKEN` header on all modifying HTTP requests (`POST /auth/login`, `POST /auth/register`, `POST /auth/logout`).
- **Rationale**: The backend relies on Spring Security's standard `CookieCsrfTokenRepository` with `httpOnly: false`. The frontend must extract this token from `document.cookie` using a utility helper function:
  ```typescript
  function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  }
  ```
  Fetching `GET /auth/me` during the application initialization is crucial because it ensures that Spring Security establishes a session and provides the initial CSRF token cookie before the client attempts any state-modifying requests.

### 3. User ID Mapping

- **Decision**: Reconcile backend user identifiers with frontend expectations.
- **Rationale**: The backend database maps the user's identifier as a `Long` numerical value, serialized as a number. The frontend's `User` model defines `id: string`. We will map the ID inside the network response parser:

  ```typescript
  interface BackendUserResponse {
    id: number
    email: string
  }

  const mapBackendUser = (data: BackendUserResponse): User => ({
    id: data.id.toString(),
    email: data.email,
  })
  ```

---

## Updated Interfaces and Contracts

The public interface for the authentication hook MUST remain fully compatible with existing consumers to prevent any refactoring leakage.

```typescript
export interface User {
  id: string
  email: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
```

---

## Detailed File Changes

### 1. [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs)

- Add `rewrites()` async function to proxy local `/auth/*`, `/transactions/*`, and `/api/*` requests to the localhost backend.

### 2. [lib/auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx)

- Implement cookie-based utility function `getCookie`.
- Implement mapper function `mapBackendUser`.
- Replace `localStorage` operations in `useEffect` on-mount mount with a `GET /auth/me` request.
- Refactor `login` to execute `POST /auth/login` containing the credentials JSON payload and forwarding the CSRF token header.
- Refactor `signup` to execute `POST /auth/register` containing the payload and forwarding the CSRF token header.
- Refactor `signOut` to execute `POST /auth/logout` forwarding the CSRF token header. Reset local user state to `null` on completion.

### 3. [lib/auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx)

- Remove references to `localStorage.clear()` in hooks.
- Stub the global `fetch` object with Vitest spy handlers to mock backend responses.
- Assert that requests pass headers (such as `Content-Type: application/json` and `X-XSRF-TOKEN`).

---

## Testing Strategy

Tests will run via Vitest under a JSDOM environment, verifying all operations.

### Stubbing Network Responses

Global fetch requests will be stubbed during test execution:

```typescript
import { vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
```

For each test scenario, `mockFetch` will resolve to custom mock Response structures:

```typescript
mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => ({ id: 101, email: 'test@budgeting.app' }),
})
```

### Simulating Cookies in JSDOM

Since JSDOM provides a functional `document` context, tests will manipulate `document.cookie` to ensure that CSRF token extraction works:

```typescript
document.cookie = 'XSRF-TOKEN=test-csrf-token'
```

The test suite will assert that mutation fetch calls include the header:
`'X-XSRF-TOKEN': 'test-csrf-token'`
