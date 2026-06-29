# Proposal: Backend Authentication Integration

## Intent

Migrate the client-side authentication flow from a `localStorage` simulation to a secure integration with the Spring Boot backend authentication API. This will establish actual user authentication, integrate cookie-based CSRF protection, map user domain models, and route local API requests through a Next.js development proxy.

## Scope

### In Scope

- **Development Proxy**: Configure a Next.js rewrite proxy in [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) to redirect `/auth/*` and future `/transactions/*` or `/api/*` endpoints from `http://localhost:3000` to `http://localhost:8080`.
- **Session Verification**: Call `GET /auth/me` on application mount in [AuthProvider](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L20) to check for an active backend session, replacing the `localStorage` check.
- **Registration**: Update `signup` in [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L72) to execute `POST /auth/register` to the backend.
- **Login**: Update `login` in [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L37) to execute `POST /auth/login` to the backend.
- **Logout**: Update `signOut` in [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L113) to execute `POST /auth/logout` to the backend.
- **CSRF Token Protection**: Extract the `XSRF-TOKEN` cookie from `document.cookie` and attach it as the `X-XSRF-TOKEN` header on mutation requests (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`).
- **User Model Reconciliation**: Map the backend user model's numerical identifier (`id: Long`) to the frontend's string representation (`id: string`) in the [User](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L5) type.
- **Authentication Testing**: Refactor [auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx) to mock backend fetch calls instead of asserting against mock `localStorage` mutations.

### Out of Scope

- Integrating transactions endpoints (`/transactions/*`) or speech-to-text (`/api/transcribe`) - these will be completed in separate SDD flows.
- Visual state changes or new UI screens (retains the existing login/signup design structure).

## Capabilities

### New Capabilities

- **Secure Backend Authentication**: Registration, login, and sessions are verified and stored securely by the Spring Boot backend.
- **CSRF Defense**: Mutation requests to the backend authentication endpoints are protected against cross-site request forgery via token validation.

### Modified Capabilities

- **Session Checking**: Application initializes its auth state by asking the backend `GET /auth/me` instead of inspecting local browser keys.

## Approach

### 1. Dev Proxy Configuration

In [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs), add a `rewrites` configuration block:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8080/auth/:path*',
      },
      {
        source: '/transactions/:path*',
        destination: 'http://localhost:8080/transactions/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },
}

export default nextConfig
```

### 2. CSRF Token Extraction

Implement a utility function to extract cookies by name to read the `XSRF-TOKEN` cookie:

```typescript
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}
```

For mutation requests (`POST /auth/login`, `POST /auth/register`, `POST /auth/logout`), fetch the current token value and add it as a header:
`'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''`

### 3. User ID Reconciliation

The backend's user representation contains `id: Long` (received as a JSON number). The frontend's [User](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L5) type represents `id` as `string`. Reconcile this inside the request handlers:

```typescript
const mapBackendUser = (data: { id: number; email: string }): User => ({
  id: data.id.toString(),
  email: data.email,
})
```

### 4. Auth Provider Refactoring

Refactor [AuthProvider](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx#L20)'s hook functions to replace `localStorage` read/writes with actual `fetch` network calls:

- **Mount check**: Issue a `GET` request to `/auth/me`. If it returns a status of 200, parse the body and call `setUser` with the mapped user data. Otherwise, clear user state.
- **Login**: Submit a `POST` request to `/auth/login` containing the JSON payload `{ email, password }` along with the CSRF header. Map and store the resulting user on success.
- **Register**: Submit a `POST` request to `/auth/register` containing the JSON payload `{ email, password }` along with the CSRF header. Map and store the resulting user on success.
- **Logout**: Submit a `POST` request to `/auth/logout` along with the CSRF header. Reset state to `null`.

### 5. Test Suite Adaptation

Refactor [auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx):

- Mock the global `fetch` function (or set up Vitest mock handlers) to intercept request paths (`/auth/login`, `/auth/register`, `/auth/logout`, `/auth/me`).
- Simulate successful responses with mocked CSRF cookie behaviors.
- Ensure that UI error assertions are still met when HTTP status codes indicate failures (e.g. invalid credentials or short passwords).

## Affected Areas

| Area                                                                                                   | Impact   | Description                                                                                                  |
| ------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) | Modified | Configure dev rewrites to proxy `/auth/*`, `/transactions/*`, and `/api/*` to `http://localhost:8080`.       |
| [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx)           | Modified | Replace `localStorage` mock logic with secure fetch requests, CSRF token extraction, and model type mapping. |
| [auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx) | Modified | Re-target auth hook tests to mock backend fetch calls instead of localStorage.                               |

## Risks

| Risk                                    | Likelihood | Mitigation                                                                                                                                                                                         |
| --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Missing CSRF Token on First Request** | Medium     | Fetching `/auth/me` on application mount forces Spring Security to generate and send the `XSRF-TOKEN` cookie before the user attempts a mutation request.                                          |
| **Cookie Domain Conflicts**             | Low        | By proxying all backend endpoints through the Next.js dev server (`http://localhost:3000`), the requests stay in a single-origin context, allowing automated cookie handshakes to work seamlessly. |
| **Backend Integration Failures**        | Medium     | Catch network failures explicitly and render client-side error states cleanly. Ensure credentials validation rejects early to save API calls.                                                      |

## Rollback Plan

- Revert the modifications to [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs), [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx), and [auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx) to restore the functional browser `localStorage` mock flow.

## Dependencies

- Spring Boot backend exposing authentication endpoints on `http://localhost:8080`.
- Spring Security setup configured to support cookie-based CSRF and CORS for the proxied requests.

## Success Criteria

- [ ] Code compiles with strict `pnpm exec tsc --noEmit` and passes all types checks.
- [ ] ESLint checks (`pnpm lint`) and formatting checks (`pnpm format:check`) pass.
- [ ] Auth tests in [auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx) pass under Vitest using mocked fetch responses.
- [ ] Manual verification shows the proxy correctly routes `/auth/*` to the Spring Boot backend.
- [ ] The `X-XSRF-TOKEN` header is verified to be present in `login`, `register`, and `logout` POST payloads during active session operations.
