# AGENTS.md — budgeting-frontend

Compact guidance for AI sessions working in this repo. Read before editing.

## Stack

- **Next.js 15.5.19 (App Router) + React 18.3.1 + TypeScript 5.7.2 (strict)**, package manager **pnpm**.
- **UI foundation is a Linear-inspired stark styling design system defined in [DESIGN.md](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/DESIGN.md)**. Adherence to [DESIGN.md](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/DESIGN.md) is mandatory for any visual changes.
- **AWS Cloudscape is deprecated and being removed.** Do not introduce new `@cloudscape-design/*` dependencies or components.
- `package.json` `name` is still `cloudscape-starter` (cosmetic leftover from the starter template; the product is `budgeting`).

### Applicable project skills

Project-pinned skills under `.agents/skills/` (only these apply here — ignore any other shadcn/tailwind skills you may see referenced_globally):

- `next-best-practices` — Next.js App Router, RSC boundaries, async APIs, metadata, bundling.
- `accessibility` — WCAG 2.2 audits, screen reader support, keyboard navigation.
- `vercel-composition-patterns` (folder `composition-patterns/`) — compound components, render props, context providers, React 19 changes.

## Commands

```
pnpm dev          # next dev
pnpm build        # next build
pnpm start        # serve production build
pnpm lint         # run lint checks
pnpm test         # run all tests
pnpm format       # format all files
pnpm format:check # check formatting
```

- **Test runner is configured with Vitest + JSDOM.** Use `pnpm test` to execute all tests, or `pnpm test:watch` for watch mode. Tests live in `*.test.ts` / `*.test.tsx` files.
- **Linting & Formatting:** ESLint 9 is configured via `eslint.config.mjs` (extending next vitals and integrating with Prettier). Prettier is configured via `.prettierrc` (single quotes, no semicolons).
- pnpm build approvals for `sharp` and `unrs-resolver` are committed in `pnpm-workspace.yaml`. If a future dependency adds install scripts, run `pnpm approve-builds` and commit the updated approvals.
- Required order when verifying a change: `pnpm format:check` → `pnpm lint` → `pnpm test` → `pnpm exec tsc --noEmit` → `pnpm build`.

## Design system wiring

- Tailwind layers and design tokens live in `app/globals.css`. Extend them there instead of scattering raw global CSS overrides.
- Reusable primitives live under `components/ui/` and should stay compatible with shadcn/ui conventions (`cn`, class-variance-authority, Tailwind utilities).
- Dark mode uses the Tailwind `dark` class on `document.documentElement` (see `lib/theme.ts` and `components/app-frame.tsx`).
- Favor semantic HTML plus Tailwind utilities for layout; do not reintroduce Cloudscape layout assumptions.

## Architecture

Root app shell with hash-routed sections, plus one real password-reset route.

- `app/page.tsx` renders `components/budgeting-app.tsx` (a `'use client'` root).
- `app/reset-password/page.tsx` is a real App Router page for reset links (`/reset-password?token=...`).
- `BudgetingApp` uses `AuthProvider` from `lib/auth.tsx`; auth is cookie-session based, not JWT-based. The frontend calls `/auth/me`, `/auth/login`, `/auth/register`, and `/auth/logout`, and sends the `X-XSRF-TOKEN` header from the `XSRF-TOKEN` cookie on mutations.
- `LoginScreen` also supports password recovery through `/auth/forgot-password`; `ResetPasswordPage` completes recovery through `/auth/reset-password`.
- `AppFrame` holds active section state (`'inicio' | 'historial' | 'insights'`) and switches between dashboard, history, and insights screens. Section links use hash anchors (`#/inicio`, `#/historial`, `#/insights`) inside `/`. Do not add `app/inicio/page.tsx`-style routes for app sections.
- Global expense state lives in `lib/store.tsx` via React Context (`StoreProvider`) and is backed by `HttpExpenseRepository`, which reads/writes the backend `/transactions` API. It is not fixture-only mock state.
- Dashboard stats come from `/dashboard/spending`; weekly budgets are backend-backed by default through `GET/PUT /auth/me/weekly-budget`. `NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET=false` keeps the localStorage fallback available for explicit local runs.
- `next.config.mjs` rewrites `/auth/*`, `/dashboard/*`, `/transactions/*`, and `/api/*` to the Spring Boot backend at `localhost:8080` during local development.
- Path alias: `@/*` → repo root (`@/components`, `@/lib`).

## Domain rules (hard constraints)

From `lib/types.ts` and `docs/PRD.md`:

- **Categories are the closed `Category` union in `lib/types.ts`** (`CATEGORIES` currently includes 18 backend-aligned uppercase values such as `COMIDA`, `SUPERMERCADO`, `FARMACIA`, `TRANSPORTE`, `OTROS`). Do not invent categories outside `CATEGORIES`.
- **Frontend `Expense.amount` is ARS pesos. Backend transaction amounts are centavos.** Convert at the data layer only: `HttpExpenseRepository` divides backend `amount` by `100` when reading and sends `Math.round(input.amount * 100)` when creating/updating.
- **Transaction list payload shape is `{ items: [...] }`.** `fetchExpenses()` reads `data.items`, filters invalid categories, and maps backend rows into frontend `Expense` objects.
- **Confirmation-before-save is mandatory.** AI-interpreted expenses must NEVER be persisted automatically. They flow through an editable draft in `components/capture-console.tsx` and require explicit user approval before `addExpense()` calls `/transactions`.
- Capture uses backend AI interpretation through `HttpCaptureService.interpretText()` → `POST /transactions/interpret`. Browser speech recognition (`es-AR`) and audio upload (`POST /api/transcribe`) only provide text; `/transactions/interpret` creates the draft.
- `/transactions/interpret` draft amounts are converted from centavos to pesos in `lib/format.ts`; keep that boundary explicit to avoid displaying centavos as pesos.
- Delete remains a local no-op in `HttpExpenseRepository.deleteExpense()`. Do not present deletion as backend-backed until the backend contract exists.

## UI copy conventions

- User-facing copy is **Rioplatense Spanish (es-AR)**, warm and direct.
- For features the backend does not yet support, say plainly **"próximamente"** (or equivalent). Do not expose or explain backend limitations in UI text.

## Tooling details

- `tsconfig.json` uses `"moduleResolution": "bundler"`, `strict: true`, `incremental: true`, `noEmit: true`. `tsconfig.tsbuildinfo` is generated; safe to delete and regenerate.
- `.next/` caches generated route types. If `tsc --noEmit` reports stale imports after moving routes/components, delete `.next/` and re-run.

## Reference docs

- `docs/PRD.md` — frontend PRD (scope, screens, business rules). Authoritative for product behavior.
- Parent workspace backend PRD: `../budgeting-backend/docs/PRD.md` — the product-level PRD this frontend derives from.
