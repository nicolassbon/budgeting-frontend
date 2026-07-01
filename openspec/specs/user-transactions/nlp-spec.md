# Specification: Connect NLP Interpretation to Spring Boot Backend

## 1. Functional Requirements

This specification uses keywords defined in RFC 2119 to indicate requirement levels.

### 1.1 Remote NLP Interpretation Request

- The frontend MUST send natural language interpretation requests to the backend endpoint: `POST /transactions/interpret`.
- The request body MUST be a JSON object containing a single `prompt` string field representing the raw text input:
  ```json
  {
    "prompt": "<rawText>"
  }
  ```
- The frontend MUST extract the CSRF token from the `XSRF-TOKEN` cookie (using a secure local helper function) and forward it as the `X-XSRF-TOKEN` HTTP header when the cookie is present.
- The request Content-Type header MUST be `application/json`.

### 1.2 NLP Response Parsing & Mapping

- The backend response body is expected to be a JSON object with the following structure:
  ```json
  {
    "description": "string | null",
    "amount": "number | null",
    "category": "string | null"
  }
  ```
- The frontend MUST parse this JSON payload and map it to the internal `Interpretation` format.
- If the parsed `amount` is not `null`, the frontend MUST convert the value from centavos (backend representation, which is an integer) to pesos (frontend representation) by dividing the value by `100`.
- The frontend MUST validate the category string returned by the backend against the strict union type of supported Spanish categories: `'COMIDA' | 'SUPERMERCADO' | 'FARMACIA' | 'ROPA' | 'TRANSPORTE' | 'VIVIENDA' | 'HOGAR' | 'SERVICIOS' | 'ENTRETENIMIENTO' | 'EDUCACION' | 'SALUD' | 'CUIDADO_PERSONAL' | 'MASCOTAS' | 'SUSCRIPCIONES' | 'REGALOS' | 'IMPUESTOS' | 'DEUDAS' | 'OTROS'`.
- If the returned category matches one of the valid strings, the frontend MUST map it to the corresponding `Category` type.
- If the category returned is `null`, is absent, or does not match one of the allowed values, the frontend MUST map it to `null`.
- If the description returned by the backend is `null`, empty, or missing, the frontend MUST fall back to using the user's raw text input as the draft description.

### 1.3 Error & Offline Fallback Behaviors

- If the backend returns a non-2xx status code, or the request fails due to network issues (e.g. timeout or offline state), the frontend MUST NOT crash.
- In case of a failed interpretation request, the system MUST catch the error, log a warning, and fall back to the manual entry mode (reverting the interface state to allow manual corrections, without updating the draft fields with invalid/partial data).
- The user MUST still be able to input expense details manually using the fallback flow if the API service is unavailable.
- The frontend MUST NOT persist any draft transaction automatically. Every interpretation outcome MUST flow through the Draft Preview screen for explicit user approval before saving.

---

## 2. User Scenarios

### 2.1 Scenario A: Successful NLP Interpretation

- **Given**: A user types `"Gasté 35 mil en el super"` and clicks "Interpretar gasto".
- **Action**: The frontend performs a `POST /transactions/interpret` with:
  - Header `X-XSRF-TOKEN` matching the `XSRF-TOKEN` cookie value.
  - Body `{"prompt": "Gasté 35 mil en el super"}`.
- **Backend Response**:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "description": "Supermercado Coto",
      "amount": 3500000,
      "category": "SUPERMERCADO"
    }
    ```
- **Then**: The frontend converts `3500000` cents to `35000` pesos, maps `SUPERMERCADO` to `SUPERMERCADO` (translated visually to "Supermercado" in the preview), and populates the Draft Preview with:
  - Description: `"Supermercado Coto"`
  - Amount: `35000`
  - Category: `'SUPERMERCADO'`
- **Verification**: The user sees the draft banner and selects "Guardar gasto" to persist.

### 2.2 Scenario B: Failed Interpretation / API Error

- **Given**: The user types `"Nafta YPF 45000"` and clicks "Interpretar gasto" but the backend is offline or returns a `500 Internal Server Error`.
- **Action**: The frontend initiates the request and catches the HTTP exception or network rejection.
- **Then**:
  - The frontend logs the error in the console.
  - The capture state is reverted to `idle` (or manual fallback layout).
  - The input field retains the user's text `"Nafta YPF 45000"`.
  - The user can select "Prefiero cargarlo a mano" or adjust and try again, ensuring they are not blocked from recording their expense.
