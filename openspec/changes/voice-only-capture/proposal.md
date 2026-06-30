# Proposal: Voice-Only Capture Console (Unified 3-State Modal Design)

## Intent

Simplify the floating capture console in `AppFrame` into a single, sleek button/dock that acts solely as a trigger. When clicked, triggered via a keyboard shortcut, or activated by a custom event, this trigger opens a unified, 3-state Capture Modal Dialog. This modal container will manage the entire voice-first ingestion pipeline: from idle capture welcome states, through real-time recording and transcription processing, to final draft editing and confirmation. This approach provides a focused, modal-driven UX, simplifies desktop layout logic, and ensures a clean mobile-friendly capture interface.

## Scope

### In Scope

- **Simplify Floating Console**: Refactor the floating `CaptureConsole` within `AppFrame` into a minimal dock/button (e.g. labeled "Capturar gasto" or displaying a minimal microphone icon) that only opens the Capture Modal Dialog when clicked.
- **Unified 3-State Capture Modal**: Implement or refactor the modal dialog to handle the following three distinct states:
  - **State 1 (Idle Capture)**: Displays a welcoming text ("Contanos tu gasto y nosotros te lo cargamos"), a large prominent microphone icon button (clicking it starts recording), and a file upload button.
  - **State 2 (Recording / Processing)**: Displays active audio wave animations during recording and shows loading/processing indicators while the audio is transcribed and interpreted by the backend.
  - **State 3 (Confirm Draft)**: Displays an editable draft expense form (Amount in ARS, Category, and Description) with "Descartar" (discard) and "Confirmar Gasto" (save) actions.
- **Modal Event Triggering**:
  - Update `Ctrl/Cmd + K` keyboard shortcut to open the Capture Modal Dialog (defaulting to State 1) instead of starting recording directly in the floating bar.
  - Update the custom `focus-capture-console` event listener to open the Capture Modal Dialog (defaulting to State 1).
- **Dashboard Empty State CTA Integration**: Update the "Capturar primer gasto" button on the empty-state `DashboardScreen` to dispatch the `focus-capture-console` event, which will open the Capture Modal Dialog.
- **Layout Sizing Transitions**: Ensure the Capture Modal Dialog transitions smoothly in size between the compact Idle/Recording states (States 1 and 2) and the detailed Confirm Draft form state (State 3).
- **Align Unit & Integration Tests**: Update and expand tests in `components/capture-console.test.tsx` and `components/app-frame.test.tsx` to assert the 3-state modal transitions, button trigger actions, event dispatches, and keybinding flows.

### Out of Scope

- Implementing backend-side speech-to-text transcription (using Web Speech API on the client-side or mocked services).
- Modifying backend server logic or endpoints (mocked client-side store remains).
- Adding multi-page navigation or URL routing for the capture flow (the modal operates fully within the single-page shell context).

## Capabilities

### New Capabilities

- **Unified Capture Modal**: Users have a single visual container for the entire ingestion flow, reducing visual clutter on the main dashboard.
- **Dynamic Modal States**: The modal scales and morphs its layout automatically from voice capture instructions to active audio waves and finally to the confirmation form.

### Modified Capabilities

- **Typeless Trigger**: The desktop floating entry point is simplified to a sleek action button.
- **Simplified Keybindings**: `Ctrl/Cmd + K` focuses the user on the capture workflow by launching the modal, rather than immediately recording audio.

## Approach

### 1. Simplify `CaptureConsole` (Trigger Dock)

- Convert the floating console at the bottom of the viewport into a simple button/dock that triggers the modal state.
- Retain position: `fixed bottom-8 left-1/2 -translate-x-1/2 z-50`.

### 2. Implement the Unified 3-State Capture Modal

- Define a component or view state inside the capture modal that handles:
  - **State 1**: Render welcome message, prominent mic button, and attachment button.
  - **State 2**: Render wave animations when recording is active or loading spinners when waiting for translation/interpretation.
  - **State 3**: Render the editable form fields with confirm/discard buttons.
- Handle state transitions in local or shared context (e.g. `idle -> recording -> processing -> draft_confirm -> idle`).

### 3. Wire Shortcuts and Events

- Map the global `keydown` event (`Ctrl/Cmd + K`) and the window listener (`focus-capture-console`) to set `isModalOpen` to `true` (starting the modal in State 1).

### 4. Test Strategy

- Ensure both trigger click, event listener, and keyboard shortcut actions are tested.
- Test that the modal correctly transitions between the 3 states.

## Affected Areas

| Area                                                                                                                                | Impact   | Description                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [capture-console.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/capture-console.tsx)           | Modified | Refactored to act as a sleek trigger button and host/open the unified 3-state capture modal.                                       |
| [app-frame.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/app-frame.tsx)                       | Modified | Integrate trigger button placement and verify modal overlay rendering.                                                             |
| [capture-console.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/capture-console.test.tsx) | Modified | Add assertions for 3-state transitions, microphone trigger in State 1, wave animations in State 2, and draft editing in State 3.   |
| [app-frame.test.tsx](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/components/app-frame.test.tsx)             | Modified | Verify that clicking the simplified trigger button, pressing `Ctrl/Cmd + K`, or receiving `focus-capture-console` opens the modal. |

## Risks

| Risk                              | Likelihood | Mitigation                                                                                                                                            |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Microphone Permission Denials** | Medium     | If permission is denied inside the modal, show a friendly warning inside State 1 and guide users to use the file upload fallback or close the modal.  |
| **Layout Sizing Jitter**          | Low        | Implement CSS transition classes (height/width/opacity) to ensure smooth expansion when morphing from State 1/2 (compact) to State 3 (expanded form). |

## Rollback Plan

- Revert the changes to the affected files using Git to restore the previously planned floating recording bar.

## Success Criteria

- [ ] Strict type checks pass cleanly (`pnpm exec tsc --noEmit`).
- [ ] ESLint checks (`pnpm lint`) and formatting checks (`pnpm format:check`) pass successfully.
- [ ] Vitest unit tests compile and run successfully.
- [ ] Clicking the floating button, pressing `Ctrl/Cmd + K`, or triggering `focus-capture-console` opens the Capture Modal Dialog.
- [ ] Capture Modal displays "Contanos tu gasto..." and the inactive mic button when first opened.
- [ ] Clicking the mic button in the modal starts audio recording and transitions to the wave animation state.
- [ ] Once speech is parsed, the modal transitions to the confirm form state.
- [ ] Discarding or saving the expense closes the modal.
