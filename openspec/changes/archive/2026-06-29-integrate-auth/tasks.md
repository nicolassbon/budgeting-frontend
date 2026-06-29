# Tasks: Backend Authentication Integration

## Plan Metadata

- **Estimated Changed Lines**: ~150 lines
- **Chain Strategy**: Phase-based atomic commits
- **Strict TDD Mode**: Enabled

---

## Tasks

### Phase 1: Foundation

- [x] Configure dev rewrites in [next.config.mjs](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/next.config.mjs) to proxy `/auth/*`, `/transactions/*`, and `/api/*` to `http://localhost:8080`.
- [x] Run production build sanity check:
  ```bash
  pnpm build
  ```

### Phase 2: Core Implementation

- [x] Add `getCookie` utility to [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) to parse cookies from `document.cookie`.
- [x] Add `mapBackendUser` mapper to [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) to reconcile backend numerical IDs into frontend strings.
- [x] Implement mount session recovery logic inside [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) `useEffect` via `GET /auth/me`.
- [x] Implement `login` in [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) by sending POST request to `/auth/login` along with local validations, JSON body, and the `X-XSRF-TOKEN` header.
- [x] Implement `signup` in [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) by sending POST request to `/auth/register` along with local validations, JSON body, and the `X-XSRF-TOKEN` header.
- [x] Implement `signOut` in [auth.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.tsx) by sending POST request to `/auth/logout` with the `X-XSRF-TOKEN` header.

### Phase 3: Testing & Verification

- [x] Update [auth.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/auth.test.tsx) to stub global `fetch`.
- [x] Mock fetch responses for:
  - Mount checks (`GET /auth/me` returning status 200 with mapped user, or status 401).
  - Login (`POST /auth/login` returning status 200 with mapped user, or status 401).
  - Signup (`POST /auth/register` returning status 200/201, or status 409).
  - Logout (`POST /auth/logout` returning status 200/204).
- [x] Assert that mutation requests send correct headers (`Content-Type: application/json` and `X-XSRF-TOKEN`).
- [x] Run the test suite:
  ```bash
  pnpm test
  ```
- [x] Verify codebase code quality:
  ```bash
  pnpm format:check && pnpm lint && pnpm exec tsc --noEmit && pnpm build
  ```
