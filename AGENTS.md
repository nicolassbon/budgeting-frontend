# AGENTS.md — budgeting-frontend

Compact guidance for AI sessions working in this repo. Read before editing.

## Stack

- **Next.js 15.5.19 (App Router) + React 18.3.1 + TypeScript 5.7.2 (strict)**, package manager **pnpm**.
- **UI library is AWS Cloudscape Design System** (`@cloudscape-design/components`), NOT shadcn/ui and NOT Tailwind. There is no `tailwind.config.*`, no `postcss.config.*`, no `components.json` in this repo.
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

## Cloudscape wiring (do not break)

- `next.config.mjs` MUST keep `transpilePackages` for `@cloudscape-design/components`, `@cloudscape-design/component-toolkit`, and `@cloudscape-design/board-components`. Next cannot bundle Cloudscape without this.
- `@cloudscape-design/global-styles/index.css` is imported **once**, in `app/layout.tsx`. Do not re-import it elsewhere.
- `app/globals.css` only contains host-page wiring (full-height root, layout background token). **Do not override Cloudscape component styles there.** Use Cloudscape design tokens, not raw CSS, for theming.
- Dark mode is toggled imperatively via `applyMode(Mode.Dark | Mode.Light)` plus the `body.awsui-dark-mode` class (see `components/app-frame.tsx`). There is no Tailwind `dark:` variant.

## Architecture

Single-page shell, **not** file-system-routed app sections.

- `app/page.tsx` renders `components/budgeting-app.tsx` (a `'use client'` root).
- `BudgetingApp` holds a local `authed` boolean and switches between `components/auth/login-screen.tsx` / `auth/signup-screen.tsx` (mock, no real auth) and `components/app-frame.tsx`. **Auth is intentionally mocked in client state** for MVP.
- `AppFrame` holds active section state (`'capturar' | 'inicio' | 'historial'`) and switches between `components/screens/{capture,dashboard,history}-screen.tsx`. Section links use hash anchors (`#/capturar`, `#/inicio`, `#/historial`) — there is **one Next route** (`/`). Do not add `app/capturar/page.tsx`-style routes for app sections.
- Global state lives in `lib/store.tsx` via React Context (`StoreProvider`). It is **in-memory mock state seeded with fixtures**, not persisted, not backed by an API. Do not wire it to a real backend yet.
- Path alias: `@/*` → repo root (`@/components`, `@/lib`).

## Domain rules (hard constraints)

From `lib/types.ts` and `docs/PRD.md`:

- **Categories are a closed enum**: `'Supermercado' | 'Farmacia' | 'Auto'`. Do not invent new categories.
- **`Expense.amount` is integer ARS pesos** in the mock. (When real backend integration comes: the budgeting backend returns `amount` as a Java `double` in **centavos**, not pesos — handle the unit conversion at the data layer, do not blindly render backend values as pesos.)
- **Confirmation-before-save is mandatory.** AI-interpreted expenses must NEVER be persisted automatically. They flow through a `DraftExpense` preview (`lib/types.ts`) and require explicit user approval. See `components/screens/capture-screen.tsx`.
- Expense parsing is a **local heuristic** (`interpretExpense` in `lib/format.ts`), not an AI service. Voice capture uses the Web Speech API with `es-AR` locale and a visual simulation fallback when unsupported.
- **Delete and date-range filtering are intentionally placeholders** ("próximamente") in the MVP. Do not implement them against fake backend capabilities.

## UI copy conventions

- User-facing copy is **Rioplatense Spanish (es-AR)**, warm and direct.
- For features the backend does not yet support, say plainly **"próximamente"** (or equivalent). Do not expose or explain backend limitations in UI text.

## Tooling details

- `tsconfig.json` uses `"moduleResolution": "bundler"`, `strict: true`, `incremental: true`, `noEmit: true`. `tsconfig.tsbuildinfo` is generated; safe to delete and regenerate.
- `.next/` caches generated route types. If `tsc --noEmit` reports stale imports after moving routes/components, delete `.next/` and re-run.
- No `opencode.json`, no `.github/` workflows, no pre-commit hooks. The repo currently has no commits on `main`.

## Reference docs

- `docs/PRD.md` — frontend PRD (scope, screens, business rules). Authoritative for product behavior.
- Parent workspace backend PRD: `../budgeting-backend/docs/PRD.md` — the product-level PRD this frontend derives from.
