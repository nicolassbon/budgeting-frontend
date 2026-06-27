# Design: Mock Frontend Integration Seams

## Technical Approach

This design introduces interface-based decoupling seams into the budgeting frontend application. This prepares the presentation layer for backend integration by isolating storage, authentication, transcription, and analytics logic behind asynchronous boundaries and custom hooks, replacing inline state mutation. It aligns the Category enum with the backend domain, handles store loading states to avoid page flickers, and uses component key-reset patterns for modals.

## Architecture Decisions

### 1. Authentication & Session Boundary

- **Choice**: Implement a custom React context `AuthProvider` in `lib/auth.tsx` storing user credentials and sessions in `localStorage` under `budgeting_registered_users` and `budgeting_user_session` respectively.
- **Alternatives considered**: NextAuth (too heavy for a pure mock seam), in-memory mock auth (loses state on page reload).
- **Rationale**: Persisting registrations and active sessions in `localStorage` allows testing signup validations and session restore while maintaining multi-user isolation.

### 2. Isolated Expense Repository Seam

- **Choice**: Abstract storage operations via `ExpenseRepository` and implement `LocalStorageExpenseRepository` isolating storage using key `budgeting_expenses_${email}`.
- **Alternatives considered**: Keeping expenses in global react state context, using a single shared localStorage key.
- **Rationale**: Isolating key names by user email guarantees complete data segregation between users. Seeds default data via `seedExpenses()` only if the key does not exist.

### 3. Decoupled Dashboard Analytics

- **Choice**: Extract calculation algorithms to pure functions in `lib/insights.ts` and expose them to components using a custom React hook `useDashboardStats()`.
- **Alternatives considered**: Inline component calculation during render.
- **Rationale**: Separating data processing from rendering logic simplifies swapping frontend calculations for backend aggregations in the future.

### 4. Category Enum Backend Alignment

- **Choice**: Define frontend domain Category type as `'GROCERIES' | 'PHARMA' | 'AUTO'` to match the backend Java enum. Map to Spanish UI labels (`"Supermercado"`, `"Farmacia"`, `"Auto"`) purely in presentation components or formatting helpers.
- **Alternatives considered**: Leak Spanish strings into the core data model.
- **Rationale**: Decouples domain representations from display formatting, preventing translation logic leaks from polluting the database contract.

### 5. Modal Lifecycle Reset Pattern

- **Choice**: Re-mount `ExpenseFormModal` using a dynamic React `key` (e.g. `key={visible ? 'open' : 'closed'}`) in `components/budgeting-app.tsx` or parent frame.
- **Alternatives considered**: Use `useEffect` to synchronize props to local state.
- **Rationale**: Eliminates React state synchronization smells and avoids double rendering or stale inputs.

---

## Data Flow

```
[UI Components] (Spanish display labels)
   │
   ├─► [useAuth()] ─────► LocalStorage (Session, Users)
   │
   ├─► [useStore()] ────► [ExpenseRepository] ────► LocalStorage (Expenses per email: GROCERIES/PHARMA/AUTO)
   │
   ├─► [useDashboardStats()] ──► [insights.ts] (Pure stats calculation)
   │
   └─► [CaptureService] ──► Mock NLP Promise parser
```

---

## File Changes

| File Path                                 | Action   | Description                                                                                    |
| :---------------------------------------- | :------- | :--------------------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| `package.json`                            | Modified | Update `"lint"` script to `"eslint ."` (or `"eslint app components lib"`).                     |
| `lib/types.ts`                            | Modified | Update `Category` to `'GROCERIES'                                                              | 'PHARMA' | 'AUTO'`. Add display mapping utility. |
| `lib/auth.tsx`                            | New      | Create `AuthProvider`, `useAuth` hook, and password/email verification.                        |
| `lib/store.tsx`                           | Modified | Consume `useAuth`. Expose `loading` in context. Inject `LocalStorageExpenseRepository`.        |
| `lib/insights.ts`                         | Modified | Extract pure calculations and implement `useDashboardStats` hook.                              |
| `components/app-frame.tsx`                | Modified | Read email from `useAuth()`, replace hardcoded email, and abstract routing.                    |
| `components/expense-form-modal.tsx`       | Modified | Adjust to use initial prop cleanly on mount. Parent will control re-mount key.                 |
| `components/screens/capture-screen.tsx`   | Modified | Consume `CaptureService` and render Web Speech API warning banner.                             |
| `components/screens/dashboard-screen.tsx` | Modified | Consume statistics from `useDashboardStats()` hook and show loading state if store is loading. |

---

## Interfaces / Contracts

```typescript
export type Category = 'GROCERIES' | 'PHARMA' | 'AUTO'

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

export interface ExpenseRepository {
  fetchExpenses(): Promise<Expense[]>
  createExpense(expense: Omit<Expense, 'id' | 'date'>): Promise<Expense>
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>
  deleteExpense(id: string): Promise<void>
}

export interface StoreContextType {
  expenses: Expense[]
  loading: boolean
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
}

export interface Interpretation {
  description: string
  amount: number | null
  category: Category | null
}

export interface CaptureService {
  interpretText(rawText: string): Promise<Interpretation>
}

export interface DashboardStats {
  total: number
  count: number
  average: number
  breakdown: Array<{ category: Category; total: number; share: number }>
  topCategory: { category: Category; total: number; share: number } | null
  monthLabel: string
}
```

---

## Testing Strategy

| Layer           | What to Test                             | Approach                                                           |
| :-------------- | :--------------------------------------- | :----------------------------------------------------------------- |
| **Unit**        | Insight calculators in `insights.ts`     | Test sum, averages, and share calculations with fixed inputs.      |
| **Unit**        | Validation rules (auth email & password) | Verify email format rejection and password length >= 6.            |
| **Integration** | `LocalStorageExpenseRepository`          | Verify isolation between different keys and mock seeding behavior. |
| **Component**   | `ExpenseFormModal` lifecycle             | Verify input state resets when component re-mounts.                |
| **Component**   | `CaptureScreen` fallback                 | Verify fallback banner is rendered when Speech API is missing.     |

---

## Migration / Rollout

No database migration is required. LocalStorage schemas will populate automatically on user login and expense operations. Spanish display labels will map on the frontend.

## Open Questions

- None
