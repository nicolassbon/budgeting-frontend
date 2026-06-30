# Implementation Map

## Known context

- `lib/store.tsx`: HTTP repository for create/fetch/update transaction flows.
- `lib/store.test.ts`: repository and provider tests around history/update/create behavior.
- `lib/insights.ts`: dashboard summary hook currently computes from local expenses.
- `lib/insights.test.ts`: pure stats tests; adapt to backend dashboard mapping coverage.
- `budgeting-backend` provides stable `GET /transactions` and `GET /dashboard/spending` contracts; treat as read-only unless mismatch blocks the slice.

## Validation

- `pnpm test`
- `pnpm lint`
- `pnpm exec tsc --noEmit`
