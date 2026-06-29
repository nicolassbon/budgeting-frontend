# Specification: Connect Transactions to Spring Boot Backend

## Purpose

Defines the functional requirements and behavior specifications for migrating the transaction/expense repository in the budgeting frontend from local storage to the Spring Boot backend API.

## Requirements

### Requirement: Concurrent Expense Retrieval (`fetchExpenses`)

The application MUST retrieve recorded expenses directly from the backend category-specific endpoints.

- The application MUST perform concurrent HTTP `GET` requests to the following endpoints:
  - `/transactions/GROCERIES`
  - `/transactions/PHARMA`
  - `/transactions/AUTO`
- The retrieval of all categories MUST be executed concurrently using `Promise.all`.
- If any of the requests fail or return a non-2xx status code, the application MUST log the failure and throw an error to prevent inconsistent state rendering.
- For each retrieved transaction object, the application MUST map the properties to conform to the frontend `Expense` model:
  - The numerical `id` returned by the backend MUST be converted to a string.
  - The `amount` property, which the backend represents as an integer in centavos (cents), MUST be divided by `100` to represent the value in pesos.
  - Since the backend does not persist or return transaction dates, the application MUST assign a fallback ISO date using `new Date().toISOString()`.
- The application MUST flatten the three category-specific response arrays into a single unified array of expenses.

#### Scenario: Successful Retrieve of All Categories
- **Given** the user is authenticated and is loading the dashboard or history screens.
- **When** `fetchExpenses` is called on the repository.
- **Then** the application MUST concurrently call `GET /transactions/GROCERIES`, `GET /transactions/PHARMA`, and `GET /transactions/AUTO`.
- **And** the server MUST respond to each with `200 OK` and a JSON array of transaction objects containing numerical IDs and amounts in cents:
  - `/transactions/GROCERIES`: `[ { "id": 1, "description": "Super", "amount": 15000, "category": "GROCERIES" } ]`
  - `/transactions/PHARMA`: `[]`
  - `/transactions/AUTO`: `[ { "id": 2, "description": "Nafta", "amount": 450000, "category": "AUTO" } ]`
- **And** the repository MUST map the values and return a flattened array:
  ```json
  [
    {
      "id": "1",
      "description": "Super",
      "amount": 150,
      "category": "GROCERIES",
      "date": "[ISO_TIMESTAMP]"
    },
    {
      "id": "2",
      "description": "Nafta",
      "amount": 4500,
      "category": "AUTO",
      "date": "[ISO_TIMESTAMP]"
    }
  ]
  ```

---

### Requirement: Transaction Creation (`createExpense`)

The application MUST persist new expenses to the backend database.

- The application MUST perform an HTTP `POST` request to `/transactions`.
- The POST body MUST be a JSON object containing the properties:
  - `description`: string matching the expense description.
  - `category`: string matching the expense category.
  - `amount`: number representing the expense amount in pesos converted to integer centavos, calculated using `Math.round(amount * 100)`.
- The HTTP request MUST include the following headers:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN`: the CSRF token extracted from the browser's `XSRF-TOKEN` cookie.
- If the request returns a status code of `201 Created` (or `200 OK`) with the created transaction:
  - The application MUST map the response's numerical `id` to a string.
  - The application MUST divide the response's `amount` (cents) by `100` to convert it back to pesos.
  - The application MUST return the mapped `Expense` object.
- If the request fails or returns a non-2xx status code, the application MUST throw an error.

#### Scenario: Successful Expense Creation
- **Given** a user is on the Capture screen and clicks "Guardar gasto" for a draft expense: `{ description: "Café", category: "GROCERIES", amount: 25.5 }`.
- **And** the browser has an active cookie `XSRF-TOKEN` set to `mock-csrf-token`.
- **When** `createExpense` is called with the expense draft.
- **Then** the application MUST send a `POST /transactions` request with body:
  ```json
  {
    "description": "Café",
    "category": "GROCERIES",
    "amount": 2550
  }
  ```
- **And** the request headers MUST include `'X-XSRF-TOKEN': 'mock-csrf-token'`.
- **And** the server MUST respond with `201 Created` and body:
  ```json
  {
    "id": 123,
    "description": "Café",
    "category": "GROCERIES",
    "amount": 2550
  }
  ```
- **And** the repository MUST return the mapped object:
  ```json
  {
    "id": "123",
    "description": "Café",
    "category": "GROCERIES",
    "amount": 25.5,
    "date": "[ISO_TIMESTAMP]"
  }
  ```

---

### Requirement: No-Op Update and Delete Compliance

Since the backend API does not currently support modifying or deleting transactions, the repository MUST fulfill the `ExpenseRepository` contract client-side without executing network requests.

- The `updateExpense` function MUST NOT make any HTTP network requests.
- The `updateExpense` function MUST immediately return the updated `Expense` representation wrapped in a resolved Promise to prevent UI flow interruption.
- The `deleteExpense` function MUST NOT make any HTTP network requests.
- The `deleteExpense` function MUST immediately return a resolved Promise to keep UI flows responsive.

#### Scenario: Silent No-Op Update
- **When** `updateExpense` is called on the repository.
- **Then** the application MUST NOT issue any network request.
- **And** the repository MUST return a resolved Promise with the modified expense.

#### Scenario: Silent No-Op Delete
- **When** `deleteExpense` is called on the repository.
- **Then** the application MUST NOT issue any network request.
- **And** the repository MUST return a resolved Promise.
