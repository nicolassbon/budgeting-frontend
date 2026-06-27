# Integration Seams Specification

## Purpose

This specification defines the functional requirements and scenarios for the architectural seams introduced to decouple the budgeting frontend UI from direct mock implementation logic.

## Requirements

### Requirement: Authentication and Session Seam

The system MUST provide an `AuthProvider` and `useAuth` hook to manage user sessions.

- The `User` interface MUST have `id: string` and `email: string`.
- Credentials MUST be validated: email format containing '@' and domain, password MUST be at least 6 characters.
- Login credentials MUST be validated against previous signups stored in `localStorage` under `budgeting_registered_users`.
- The active session MUST be stored in `localStorage` under `budgeting_user_session`.

_Scenario: User Login Success_

- **Given** registered user "user@example.com" with password "password123" exists in `budgeting_registered_users` in `localStorage`.
- **When** credentials "user@example.com" and "password123" are submitted to login.
- **Then** the session MUST be stored in `localStorage` under `budgeting_user_session` and `useAuth()` MUST return the authenticated `User`.

### Requirement: Expense Repository Persistence Seam

The system MUST implement an `ExpenseRepository` interface and its mock implementation `LocalStorageExpenseRepository`.

- `Category` type MUST be `'GROCERIES' | 'PHARMA' | 'AUTO'` to align with the backend domain model.
- The application MUST map these categories to Spanish UI labels (`'GROCERIES'` maps to `"Supermercado"`, `'PHARMA'` to `"Farmacia"`, `'AUTO'` to `"Auto"`) in the presentation layer.
- The React `StoreContext` value MUST expose a `loading` boolean state indicating whether the repository fetch is active.
- Storage MUST segment user expenses by their authenticated email, using key `budgeting_expenses_${email}` in `localStorage`.
- Seeding default mock data via `seedExpenses()` MUST only happen if no expenses exist in the isolated key for the logged-in user.
- Network latency MUST be simulated asynchronously with a 500ms delay.

_Scenario: Get Segmented Expenses with Seeding_

- **Given** no data exists under `budgeting_expenses_user@example.com`.
- **When** fetching expenses for user "user@example.com".
- **Then** default mock data MUST be seeded in `budgeting_expenses_user@example.com` and returned after a simulated 500ms delay.

### Requirement: Capture Interpretation & Dictation Seam

The system MUST process capture text input and speech dictation.

- Text interpretation MUST be managed by a `CaptureService` with method `interpretText(rawText: string): Promise<Interpretation>`.
- The `Interpretation` interface MUST return `{ description: string; amount: number | null; category: Category | null }`.
- NLP interpretation MUST run asynchronously via `CaptureService.interpretText`.
- When dictation is simulated because Web Speech API is unsupported, the UI MUST display warning banner `"Simulando dictado (el navegador no soporta Web Speech API)"`.

_Scenario: Simulated Dictation Mode_

- **Given** the browser does not support Web Speech API.
- **When** user starts dictation.
- **Then** the warning banner `"Simulando dictado (el navegador no soporta Web Speech API)"` MUST be visible.

### Requirement: Dashboard Statistics Seam

The system MUST expose dashboard statistics via a `useDashboardStats` custom hook.

- Calculations MUST be decoupled from render cycles and handled via pure helper functions, returning total, count, average, category breakdown, top category, and month label.

_Scenario: Retrieve Stats_

- **Given** a list of expenses for the current user.
- **When** `useDashboardStats` is called.
- **Then** it MUST calculate stats via pure helper functions and return total, count, average, breakdown, top category, and month label.

### Requirement: Modal Lifecycle Resets

The `ExpenseFormModal` component MUST reset its state to initial properties when transitioning to visible.

- To prevent synchronization bugs, state reset MUST be achieved by unmounting and re-mounting the component using a React `key` (e.g. key based on visibility status) or conditional rendering, avoiding `useEffect` prop synchronization.

_Scenario: Modal Open Reset_

- **Given** the modal has modified description, amount, or category state from a previous action.
- **When** the modal transitions to visible.
- **Then** the inputs MUST reset to their initial properties.

### Requirement: Navigation and Profile Integration

The system MUST support abstracted route navigation and display the logged-in user's profile.

- Navigation MUST use abstracted route triggers instead of inline event prevent-defaults.
- The hardcoded profile email in `components/app-frame.tsx` MUST be replaced with `user.email` from `useAuth()`.

_Scenario: Profile Rendering_

- **Given** user "user@example.com" is authenticated.
- **When** the AppFrame is rendered.
- **Then** it MUST display "user@example.com" instead of a hardcoded email.

### Requirement: package.json ESLint Migration

The `"lint"` script in `package.json` MUST run the direct ESLint command instead of next lint.

_Scenario: Run Lint Script_

- **Given** a development shell inside the project root.
- **When** running npm run lint.
- **Then** the direct ESLint command MUST execute.
