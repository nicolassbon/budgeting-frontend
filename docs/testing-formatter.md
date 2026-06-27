# Testing, Linting, and Formatting

- Run the verification chain with scripts from `package.json`: `pnpm format:check` → `pnpm lint` → `pnpm test` → `pnpm exec tsc --noEmit` → `pnpm build`.
- Tests use **Vitest + JSDOM + React Testing Library**.
- Formatting uses **Prettier** (`pnpm format`, `pnpm format:check`).
- Linting uses **ESLint 9 flat config** with `eslint-config-next` pinned to the installed **Next.js 15** major and `eslint-config-prettier` last in the config array.
- pnpm build-script approvals for `sharp` and `unrs-resolver` are committed in `pnpm-workspace.yaml`, so the scripts above run without local approval prompts. If a new dependency introduces install scripts, re-run `pnpm approve-builds` and commit the updated file.
