# Implementation Tasks: Voice-Only Capture Console (Unified 3-State Modal Design)

This checklist details the tasks required to implement the simplified floating trigger button and the unified 3-state Capture Modal Dialog, along with unit and integration testing updates.

## Phase 1: Planning & Setup

- [x] **Task 1.1: Verify local environment baseline**
  - Run the test suite, linter, formatter, type checker, and build to establish a green baseline.
  - Commands:
    - `pnpm format:check`
    - `pnpm lint`
    - `pnpm test`
    - `pnpm exec tsc --noEmit`
    - `pnpm build`

---

## Phase 2: Test Suite Adjustment (TDD Mode)

- [x] **Task 2.1: Update `components/app-frame.test.tsx` for modal triggers**
  - Adjust tests to verify that:
    - Clicking the simplified floating trigger button/dock opens the modal dialog.
    - Pressing keyboard shortcut `Ctrl + K` (or `Cmd + K`) toggles the modal display.
    - Dispatching the custom window event `'focus-capture-console'` opens the modal in State 1.
  - Ensure assertions that mock speech recognition directly from `AppFrame` level without the modal are removed.

- [x] **Task 2.2: Add 3-state coverage in `components/capture-console.test.tsx`**
  - Write test assertions covering the modal states:
    - **State 1**: Test that the welcome text `"Contanos tu gasto y nosotros te lo cargamos"` is present, the file upload button exists, and clicking the prominent mic button starts recording.
    - **State 2**: Assert that active audio wave elements/classes are displayed during recording, and spinners/loading messages are visible during processing.
    - **State 3**: Verify that the editable form fields (Amount, Category, Description) are populated and that clicking `"Confirmar Gasto"` saves the transaction, while `"Descartar"` closes the modal and ignores changes.
  - Test layout sizing transitions by verifying CSS class state changes.

---

## Phase 3: Component Implementation

- [x] **Task 3.1: Simplify floating console UI in `components/capture-console.tsx`**
  - Refactor the floating container in `AppFrame` into a single sleek trigger button (e.g. labeled "Capturar gasto" or displaying a minimal microphone icon).
  - Include the keyboard shortcut indicator badge (`Ctrl+K` or `⌘K`).
  - Completely remove text input fields, the Wand icon, and manual recording buttons from the floating viewport dock.

- [x] **Task 3.2: Implement the Unified Capture Modal Dialog**
  - Create the modal layout container with a dim overlay backdrop.
  - Implement state machine hooks or state variables to manage transitions: `idle` (State 1) -> `recording` (State 2) -> `processing` (State 2) -> `draft` (State 3) -> `idle` / `closed`.
  - Add smooth CSS transitions to animate container size changes between compact (States 1 & 2) and expanded (State 3) dimensions.

- [x] **Task 3.3: Implement State 1 (Idle Capture) View**
  - Render the welcome message `"Contanos tu gasto y nosotros te lo cargamos"`.
  - Add the prominent microphone icon button. Wire click callback to launch Web Speech recognition.
  - Add the paperclip file selector. Wire file load callback to POST to `/api/transcribe`.

- [x] **Task 3.4: Implement State 2 (Recording / Processing) View**
  - Render animated vertical audio wave bars during voice recording.
  - Render spinners or loading messages when audio is being transcribed and interpreted.

- [x] **Task 3.5: Implement State 3 (Confirm Draft) View**
  - Render amount input, description input, and category dropdown (limited to `'Supermercado' | 'Farmacia' | 'Auto'`).
  - Wire `"Confirmar Gasto"` and `"Descartar"` button callbacks to save or reject the draft.

- [x] **Task 3.6: Wire keyboard shortcuts and global events**
  - Bind `keydown` listener to handle `Ctrl/Cmd+K` (toggle modal) and `Escape` (close/discard).
  - Bind window listener for `'focus-capture-console'` to open the modal in State 1.

- [x] **Task 3.7: Verify Dashboard Screen integration**
  - Check that clicking the empty state `"Capturar primer gasto"` button on the dashboard fires `'focus-capture-console'`.

---

## Phase 4: Verification & Quality Audits

- [x] **Task 4.1: Code quality & formatting validation**
  - Format the codebase: `pnpm format`
  - Run lint checks: `pnpm lint`
  - Perform typescript compilation checks: `pnpm exec tsc --noEmit`

- [x] **Task 4.2: Execute test suite**
  - Verify all unit and integration tests compile and run green: `pnpm test`

- [x] **Task 4.3: Production build validation**
  - Ensure the Next.js production build compiles cleanly: `pnpm build`
