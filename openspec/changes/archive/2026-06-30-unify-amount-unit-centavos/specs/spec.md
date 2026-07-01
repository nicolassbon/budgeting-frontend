# Specification: Unify Amount Unit on Centavos (Frontend)

This specification defines the contract and client-side implementation requirements for adapting the AI transaction interpretation endpoint to use centavos as the standard unit of currency. This is a delta specification that modifies the main specification at [openspec/specs/user-transactions/nlp-spec.md](file:///home/nico/Escritorio/budgeting-workspace/budgeting-frontend/openspec/specs/user-transactions/nlp-spec.md).

## 1. Backend Endpoint Contract

The backend exposes an endpoint for interpreting natural language text inputs.

### 1.1 HTTP Endpoint Details

- **Endpoint Path**: `POST /transactions/interpret`
- **Headers**:
  - `Content-Type`: `application/json` (MUST be set)
  - `X-XSRF-TOKEN`: CSRF token from the `XSRF-TOKEN` cookie (MUST be forwarded if present)

### 1.2 Request Schema

The request payload MUST be a JSON object conforming to the following structure:

```json
{
  "prompt": "string"
}
```

- `prompt`: The raw text input entered by the user.

### 1.3 Response Schema

The response payload MUST be a JSON object containing the parsed entities:

```json
{
  "description": "string | null",
  "amount": "number | null",
  "category": "string | null"
}
```

- `description`: The interpreted description of the expense.
- `amount`: The interpreted amount **in centavos** (integer). If no amount is detected, it MUST be `null`.
- `category`: The interpreted category, conforming to the application's supported categories (`'COMIDA' | 'SUPERMERCADO' | 'FARMACIA' | 'ROPA' | 'TRANSPORTE' | 'VIVIENDA' | 'HOGAR' | 'SERVICIOS' | 'ENTRETENIMIENTO' | 'EDUCACION' | 'SALUD' | 'CUIDADO_PERSONAL' | 'MASCOTAS' | 'SUSCRIPCIONES' | 'REGALOS' | 'IMPUESTOS' | 'DEUDAS' | 'OTROS'`) or `null` if not mapped.

---

## 2. Client-Side Behavior (HttpCaptureService.interpretText)

The frontend captures natural language input via the `HttpCaptureService.interpretText(rawText: string)` method.

### 2.1 Request Generation

- The frontend MUST send natural language interpretation requests to the backend endpoint: `POST /transactions/interpret`.
- The request body MUST be a JSON object containing a single `prompt` string field representing the raw text input.
- The frontend MUST extract the CSRF token from the `XSRF-TOKEN` cookie and forward it as the `X-XSRF-TOKEN` HTTP header when the cookie is present.

### 2.2 Response Processing & Unit Conversion

- The frontend MUST parse the backend JSON response payload.
- **Currency Unit Conversion**:
  - If the returned `amount` is not `null` (and is defined), the frontend MUST convert the amount from centavos to pesos by dividing the value by `100`.
  - If the returned `amount` is `null` or undefined, the mapped `amount` MUST be `null`.
- **Category Validation**:
  - The frontend MUST validate the category string returned by the backend.
  - If the returned category matches one of the valid frontend `Category` values, the frontend MUST map it to that `Category`.
  - If the category returned is `null`, is absent, or does not match one of the allowed values, the frontend MUST map it to `null`.
- **Description Mapping**:
  - If the description returned by the backend is `null`, empty, or missing, the frontend MUST fall back to using the user's raw text input as the draft description.

### 2.3 Error and Offline Handling

- If the backend returns a non-2xx status code, or the request fails due to network issues (e.g. timeout or offline state), the frontend MUST NOT crash.
- The system MUST catch the error, log a warning, and fall back to manual entry mode.
- The user MUST still be able to input expense details manually using the fallback flow if the API service is unavailable.
- Every interpretation outcome MUST flow through the Draft Preview screen for explicit user approval before saving. The frontend MUST NOT persist any draft transaction automatically.

---

## 3. Integration & Unit Test Scenarios

These scenarios define the test contract matching the Vitest test structure in `lib/format.test.ts` and `components/screens/capture-screen.test.tsx`.

### 3.1 Unit Test Scenario (HttpCaptureService)

**Scenario**: Successful remote NLP interpretation with amount in centavos.

- **Given**: The user types `"supermercado 3500"` which results in calling `HttpCaptureService.interpretText`.
- **When**: The backend responds with:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "description": "Supermercado Coto",
      "amount": 350000,
      "category": "COMIDA"
    }
    ```
- **Then**: `HttpCaptureService.interpretText` MUST convert the `amount` value from centavos to pesos by dividing by 100:
  - Mapped `description` MUST be `"Supermercado Coto"`.
  - Mapped `amount` MUST be `3500` (which is `350000 / 100`).
  - Mapped `category` MUST be `"COMIDA"`.

---

### 3.2 Integration Test Scenario (CaptureScreen Component)

**Scenario**: User inputs a transaction via NLP prompt, validates draft in pesos, and saves it.

- **Given**: The backend `/transactions/interpret` is mocked to return:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "description": "70 mil en el super",
      "amount": 7000000,
      "category": "COMIDA"
    }
    ```
- **When**: The user types `"70 mil en el super"` in the prompt input field and clicks the "Interpretar gasto" button.
- **Then**:
  - The UI MUST display the "Borrador interpretado" preview banner.
  - The description input in the preview form MUST show `"70 mil en el super"`.
  - The amount input field MUST show `70000` (pesos), indicating that the frontend divided the backend value `7000000` (centavos) by 100.
  - The category input field MUST show `"COMIDA"`.
- **When**: The user clicks the "Guardar gasto" button.
- **Then**:
  - The component MUST invoke the store `addExpense` function with the mapped values in pesos (description: `"70 mil en el super"`, amount: `70000`, category: `"COMIDA"`).
