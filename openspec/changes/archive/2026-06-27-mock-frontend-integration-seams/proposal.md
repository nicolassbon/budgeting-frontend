# Proposal: Mock Frontend Integration Seams

## Intent

This change introduces architectural boundaries (seams) to decouple the frontend UI from direct mock implementation logic. This prepares the application for future backend API integration, addresses Next.js 16 linting deprecations, fixes modal state leaks, ensures honest simulation visibility, and enables clean navigation transitions.

## Scope

### In Scope

- Define AuthContext/useAuth seam.
- Define ExpenseRepository seam and LocalStorageExpenseRepository isolated by user email.
- Define CaptureService NLP interpretation seam.
- Define useDashboardStats stats seam.
- Clean package.json eslint task.
- Clean modal form state resets on transition to visible.
- Decouple navigation triggers.
- Honest mock status in UI for unavailable features (third-party login, Web Speech API fallback).

### Out of Scope

- Creating actual HTTP endpoints/controllers.
- Implementing true browser routing (remains single-page shell).
- Database integrations.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- None (architectural refactor; no user-visible functional capability changes, only technical seams)

## Approach

- Introduce context hooks, repository interfaces, and clean async boundaries.
- Segregate calculations in pure functions in [insights.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/insights.ts).
- Add warning indicators for simulated features.

## Affected Areas

| Area                                                                                                                                | Impact   | Description                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| [budgeting-app.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/budgeting-app.tsx)               | Modified | Integrate AuthProvider and clean auth status state.                                  |
| [store.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/store.tsx)                                      | Modified | Expose ExpenseRepository interface and LocalStorageExpenseRepository implementation. |
| [format.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/format.ts)                                      | Modified | Move NLP parsing logic under CaptureService interface.                               |
| [capture-screen.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/capture-screen.tsx)     | Modified | Consume CaptureService asynchronously and display honest dictation warning.          |
| [history-screen.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/history-screen.tsx)     | Modified | Integrate AuthContext for user-specific expenses.                                    |
| [auth-shell.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/auth/auth-shell.tsx)                | Modified | Connect to AuthContext.                                                              |
| [login-screen.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/auth/login-screen.tsx)            | Modified | Connect to AuthContext.                                                              |
| [signup-screen.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/auth/signup-screen.tsx)          | Modified | Connect to AuthContext.                                                              |
| [insights.ts](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/lib/insights.ts)                                  | Modified | Separate derived stats into pure functions.                                          |
| [dashboard-screen.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/screens/dashboard-screen.tsx) | Modified | Consume useDashboardStats hook.                                                      |
| [expense-form-modal.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/expense-form-modal.tsx)     | Modified | Reset state on visibility transition.                                                |
| [app-frame.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/app-frame.tsx)                       | Modified | Abstract navigation triggers from path state.                                        |
| [package.json](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/package.json)                                    | Modified | Replace next lint script.                                                            |

## Risks

| Risk                       | Likelihood | Mitigation                                         |
| -------------------------- | ---------- | -------------------------------------------------- |
| Multi-user isolation bugs  | Low        | Implement robust email-isolated localStorage keys. |
| UI flicker from mock delay | Low        | Display proper loading states/indicators.          |

## Rollback Plan

- Revert git changes on affected files to restore previous simple React state mock.

## Dependencies

- None

## Success Criteria

- [ ] Code compiles with strict tsc --noEmit.
- [ ] ESLint checks pass.
- [ ] Local storage isolating key is based on the logged-in user email.
- [ ] User can log in, log out, view only their expenses, and simulate capture NLP.
