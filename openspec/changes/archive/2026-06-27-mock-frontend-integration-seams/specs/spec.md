# Specification: Mock Frontend Integration Seams

## 1. Introduction & Executive Summary

This specification defines the decoupling seams, interfaces, and state reset behaviors required to prepare the budgeting frontend for integration with a backend API. The current client-only codebase mixes UI views with direct mock logic and raw synchronous state manipulation. By introducing asynchronous boundaries, repository abstractions, and standardized React Context hooks, this change establishes a clean separation of concerns. This ensures that the UI can interact with services via standardized TypeScript boundaries, enabling backend APIs to replace the mock implementations without rewriting UI layout or state logic.

---

## 2. Interface Boundaries & TypeScript Declarations

### 2.1 Authentication and Session Seam

An authentication boundary MUST be introduced in a new file `lib/auth.tsx`. The UI MUST interact with authentication exclusively through the `useAuth` hook.

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

### 2.2 Expense Persistence Seam

Expense persistence operations MUST be abstracted into an `ExpenseRepository` interface. The `StoreProvider` in `lib/store.tsx` MUST use this repository for data fetching and mutations.

```typescript
export interface Expense {
  id: string
  description: string
  amount: number
  category: Category
  date: string // ISO String format YYYY-MM-DD
}

export type Category =
  | 'alimentacion'
  | 'transporte'
  | 'servicios'
  | 'entretenimiento'
  | 'otros'

export interface ExpenseRepository {
  fetchExpenses(): Promise<Expense[]>
  createExpense(expense: Omit<Expense, 'id' | 'date'>): Promise<Expense>
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>
  deleteExpense(id: string): Promise<void>
}
```

### 2.3 Natural Language Capture Seam

The text interpretation logic MUST be decoupled from UI screens and abstracted behind a `CaptureService` interface.

```typescript
export interface Interpretation {
  description: string
  amount: number | null
  category: Category | null
}

export interface CaptureService {
  interpretText(rawText: string): Promise<Interpretation>
}
```

### 2.4 Dashboard Statistics Seam

A statistics abstraction layer MUST be introduced. The dashboard UI MUST fetch computed dashboard statistics through a custom hook `useDashboardStats()`, returning the following data structure:

```typescript
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

## 3. Functional Requirements

### 3.1 Authentication & Session

- **Session Persistence**: The active authentication session MUST be stored in `localStorage` under a dedicated key (e.g., `budgeting_user_session`). On page reload, the session MUST be recovered.
- **Asynchronous Mock API**: Auth operations (login, signup, signOut) MUST return Promises simulating a network call with a latency of 500ms ± 100ms.
- **Multi-User Isolation**: Expenses MUST be stored and isolated per user session. The persistence seam MUST use the authenticated user's identifier (e.g., email or ID) to segment local storage keys (e.g., `budgeting_expenses_${user.email}`).
- **Form Validation**:
  - The login and signup processes MUST validate basic email syntax (containing `@` and a valid domain ending).
  - The signup process MUST validate that the password is at least 6 characters in length.
  - If validation fails, the service MUST reject the Promise with a clear validation error.
- **Mock Honesty**: UI views for external or third-party authentication (e.g., Google or Apple login) MUST display a clear "coming soon" badge or simulated warning, indicating they are not currently functional.

### 3.2 Expense Persistence Seam

- **Repository Hookup**: The React `StoreContext` and its associated `useStore` hook MUST delegate operations to an implementation of `ExpenseRepository`.
- **LocalStorage Repository Implementation**: A `LocalStorageExpenseRepository` class MUST be created to serve as the active provider.
- **Initial Seeding**: If no stored expenses exist in `localStorage` for the current authenticated user, the repository MUST seed the user's storage with default mock data retrieved via `seedExpenses()`.
- **Asynchronous Latency**: All repository methods MUST simulate network latency using an asynchronous delay (e.g., 400ms to 600ms).

### 3.3 Natural Language Capture & Speech Recognition

- **Async Interpretation**: Natural language text interpretation MUST run asynchronously via `CaptureService.interpretText`. The mock implementation MUST simulate parsing latency (e.g., 300ms) before returning the parsed `Interpretation`.
- **Honest Speech Recognition Status**:
  - When the browser does not support the Web Speech API (`window.SpeechRecognition` and `window.webkitSpeechRecognition` are both undefined), the recording flow MUST fallback gracefully.
  - In the fallback state, the UI MUST display a visible warning message or banner: _"Simulando dictado (el navegador no soporta Web Speech API)"_.
  - When dictation is simulated, it MUST populate the capture input with a mock phrase after a short delay to allow testing.

### 3.4 Dashboard & Insights Stats

- **Decoupled Calculations**: The dashboard screen MUST NOT directly compute statistics from the raw list of expenses in the render cycle.
- **Hook Integration**: The dashboard screen MUST invoke `useDashboardStats()`, which is responsible for returning the pre-calculated statistics.
- **Calculation Separation**: The business logic for statistics aggregation (calculating sum, counts, categories share) MUST be separated from React hook logic into pure helper functions. This ensures that the calculation code is ready to be completely removed or replaced by a backend API query return.

### 3.5 Modal Lifecycle & Form State Reset

- **State Reset on Open**: The `ExpenseFormModal` component MUST reset its internal form states (`description`, `amount`, `category`) to match the `initial` expense property values (or empty default values if creating a new expense) every time the modal's `visible` prop transitions from `false` to `true`.
- **No State Leaks**: The modal MUST NOT retain modifications or input text from previous open sessions if the modal was closed without saving.

### 3.6 Navigation & Routing

- **Abstracted Navigation**: Navigation and section changes in `app-frame.tsx` MUST use an abstracted route trigger instead of inline event prevent-defaults paired directly with local layout state.
- **Path Mapping Compatibility**: The navigation seam MUST define application paths in a routing map (e.g. mapping internal page IDs to URL hashes like `#dashboard` or `#expenses`), allowing future mapping to browser paths.

### 3.7 package.json ESLint Configuration

- **ESLint Upgrades**: The `"lint"` script in `package.json` MUST be updated from `"next lint"` to direct invocation of ESLint (e.g., `"eslint ."` or `"eslint app components lib"`). This avoids deprecated Next.js lint configurations and aligns the codebase for Next.js 16 updates.

---

## 4. Non-Functional Requirements

- **Type Safety**: All interfaces, methods, and component props MUST be strictly typed in TypeScript. The compilation task (`pnpm exec tsc --noEmit`) MUST succeed without errors.
- **Lint Compliance**: All code changes MUST pass ESLint checks run via `pnpm lint`.
- **User Transparency**: Mock simulations for data saving, speech recognition, and authentication latency MUST be documented or visibly indicated in the interface to prevent developer or user confusion.

---

## 5. Testable Scenarios (Given/When/Then)

### 5.1 Authentication Validation and Session

- **Scenario: Successful Signup Validation**
  - **Given** the user is on the signup screen.
  - **When** the user inputs an email `"test@example.com"` and a password of `"password123"` and clicks the signup button.
  - **Then** the `AuthProvider` MUST successfully process the registration and save the session to `localStorage`.

- **Scenario: Rejected Short Password**
  - **Given** the user is on the signup screen.
  - **When** the user inputs an email `"test@example.com"` and a password of `"123"` and clicks signup.
  - **Then** the registration MUST be rejected, and an error message indicating that the password is too short (less than 6 characters) MUST be displayed.

- **Scenario: Isolated User Data Storage**
  - **Given** user A (`userA@example.com`) is logged in and adds an expense.
  - **When** user A logs out, and user B (`userB@example.com`) logs in.
  - **Then** the expense list loaded for user B MUST NOT contain any of the expenses added by user A.

### 5.2 Expense Repository Persistence

- **Scenario: Load Seeps on Empty Storage**
  - **Given** a new user logs in for the first time and has no budgeting expenses in `localStorage`.
  - **When** the budgeting dashboard page is loaded.
  - **Then** the repository MUST retrieve the default seed expenses and write them to `localStorage` under the user's specific key.

- **Scenario: LocalStorage Update**
  - **Given** the user is logged in and has an expense with ID `"123"`.
  - **When** the user edits the description of expense `"123"` and saves.
  - **Then** the repository MUST write the updated expense to `localStorage` and trigger a state update in the store.

### 5.3 Natural Language Capture & Speech Recognition Fallback

- **Scenario: Speech API Unavailable Fallback**
  - **Given** the user is on the capture screen and the browser does not support `window.SpeechRecognition`.
  - **When** the user clicks the microphone button to start recording.
  - **Then** the application MUST display the banner `"Simulando dictado (el navegador no soporta Web Speech API)"` and automatically simulate the typing of a default mock text after a delay.

### 5.4 Modal Form Reset

- **Scenario: Modal Closes and Resets**
  - **Given** the user opens the "Add Expense" modal, types `"Almuerzo"` into the description, and closes the modal without saving.
  - **When** the user opens the "Add Expense" modal again.
  - **Then** the description input field MUST be empty.

### 5.5 ESLint Task Compliance

- **Scenario: Linter Task Runs**
  - **Given** the developer triggers code analysis.
  - **When** the command `pnpm lint` is executed.
  - **Then** the command MUST complete successfully without calling deprecated next-lint commands.
