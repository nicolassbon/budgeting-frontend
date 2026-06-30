# Specification: Voice-Only Capture Console (Unified 3-State Modal Design)

This specification defines the functional requirements, browser integration, keyboard shortcut flows, layout transitions, and testing scenarios for the simplified floating console trigger and the unified 3-state Capture Modal Dialog.

## 1. Functional Requirements

### 1.1 Simplified Floating Console Trigger

- The floating capture console (rendered by `CaptureConsole` within `AppFrame`) MUST NOT display any text inputs, manual recording options, or upload inputs directly in the viewport.
- The floating console MUST act solely as a sleek trigger button or minimal dock (e.g., displaying "Capturar gasto" or a minimal microphone button).
- Clicking this trigger MUST open the Capture Modal Dialog, defaulting to State 1 (Idle Capture).

### 1.2 Unified Capture Modal Dialog States

The Capture Modal Dialog MUST act as a single, modal container managing three distinct functional states:

#### 1.2.1 State 1: Idle Capture

- **Visuals**: Displays the welcome message: `"Contanos tu gasto y nosotros te lo cargamos"`.
- **Primary Action**: Displays a large, prominent microphone button.
  - This button MUST be inactive initially.
  - Clicking this button MUST request mic permissions (if not already granted) and start voice recording, transitioning the modal to State 2.
- **Secondary Action**: Displays an attachment button (e.g., Paperclip icon) to select and upload a pre-recorded audio file. Selecting a file MUST trigger transcription and interpretation, transitioning the modal to State 2 (Processing).

#### 1.2.2 State 2: Recording / Processing

- **Recording Sub-State**:
  - Displays active, animated audio wave bars to indicate that the browser is actively recording the user's voice.
  - Clicking a stop button or pressing the shortcut keys MUST stop the recording and trigger the transcription/interpretation request.
- **Processing Sub-State**:
  - Displays a loading indicator (e.g., spinner or processing text) indicating that the audio file is being transcribed (via Web Speech API or backend endpoint `/api/transcribe`) and interpreted (via natural language parsing).
- **Errors**: If transcription or interpretation fails, the modal MUST return to State 1 and display an error message (e.g., `"No pudimos transcribir el audio."`).

#### 1.2.3 State 3: Confirm Draft

- **Visuals**: Displays the interpreted transaction details in an editable form:
  - **Amount**: Integer value representing ARS pesos.
  - **Category**: A dropdown selector limited to the closed enum: `'Supermercado' | 'Farmacia' | 'Auto'`.
  - **Description**: Text description field.
- **Actions**:
  - **Descartar Button**: Discards the interpreted draft and closes the modal (or returns to State 1).
  - **Confirmar Gasto Button**: Saves the draft expense to the context store, triggers a toast notification saying `"Gasto guardado. Lo vas a ver en tu historial."`, and closes the modal.

### 1.3 Web Speech API Integration (Within State 2)

- The application MUST check for Web Speech API availability when starting recording in State 1.
- If unsupported, the recording button MUST show a graceful warning or fallback simulation, notifying the user.
- Recording MUST target Argentine Spanish locale (`es-AR`) and direct the output text automatically into the natural language interpretation layer upon completion.

### 1.4 Layout Sizing Transitions

- The Capture Modal Dialog container MUST dynamically adjust its dimensions depending on the active state.
- **State 1 & State 2**: Rendered in a compact, focused modal layout (e.g., a small card or dialog block) to highlight the voice trigger.
- **State 3**: Expands smoothly (using CSS/Tailwind transitions on height, width, and scale) into a larger form layout suitable for editing text inputs.

---

## 2. Event & Navigation Mechanics

### 2.1 Keyboard Shortcuts

- The application MUST listen for a global `Ctrl + K` (Windows/Linux) or `Cmd + K` (macOS) key combination.
- Upon key combination:
  - The default browser shortcut action MUST be prevented.
  - The Capture Modal Dialog MUST open (defaulting to State 1). If the modal is already open, pressing this shortcut MUST close it.
- The modal MUST listen for the `Escape` key:
  - Pressing `Escape` when the modal is open in any state MUST close the modal. If in State 3, this acts as discarding the draft.

### 2.2 Custom Window Events

- The application MUST listen for the custom event `'focus-capture-console'` on the global `window` object.
- When this event is received:
  - The Capture Modal Dialog MUST be opened immediately (defaulting to State 1).

### 2.3 Dashboard Screen Integration

- The empty state CTA `"Capturar primer gasto"` on the `DashboardScreen` MUST dispatch the `'focus-capture-console'` event to open the Capture Modal Dialog.

---

## 3. Test Scenarios (Gherkin Scenarios)

### Scenario 1: Opening the Capture Modal via Keyboard Shortcut

- **Given** the user is viewing the main screen and the Capture Modal is closed.
- **When** the user presses `Ctrl + K` (or `Cmd + K`).
- **Then** the Capture Modal Dialog MUST open.
- **And** it MUST display the State 1 (Idle Capture) view with the welcome text `"Contanos tu gasto y nosotros te lo cargamos"`.

### Scenario 2: Starting recording from State 1

- **Given** the Capture Modal is open in State 1 (Idle Capture).
- **When** the user clicks the prominent microphone button.
- **Then** the browser microphone recording MUST be initialized.
- **And** the modal MUST transition to State 2 (Recording), displaying active audio wave animations.

### Scenario 3: Confirming a draft in State 3

- **Given** the modal is in State 3 (Confirm Draft) displaying the interpreted amount, category, and description.
- **When** the user clicks `"Confirmar Gasto"`.
- **Then** the expense MUST be saved to the global store.
- **And** the modal MUST close.
- **And** a toast saying `"Gasto guardado. Lo vas a ver en tu historial."` MUST be shown.

### Scenario 4: Discarding a draft in State 3

- **Given** the modal is in State 3 (Confirm Draft).
- **When** the user clicks `"Descartar"` or presses `Escape`.
- **Then** the draft MUST be deleted.
- **And** the modal MUST close without saving.

### Scenario 5: Dashboard CTA opens the Modal

- **Given** the user is on the empty dashboard screen.
- **When** the user clicks `"Capturar primer gasto"`.
- **Then** the custom event `'focus-capture-console'` MUST be dispatched.
- **And** the Capture Modal MUST open in State 1.
