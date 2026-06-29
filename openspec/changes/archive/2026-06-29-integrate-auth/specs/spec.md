# Specification: Backend Authentication Integration

## Purpose

Defines the functional requirements and behavior specifications for integrating the client-side authentication hook with the Spring Boot backend authentication endpoints.

## Requirements

### Requirement: Session Recovery (GET /auth/me)

The application MUST verify if the user has an active session on the backend when it mounts.

- The application MUST perform a `GET` request to `/auth/me` during initialization.
- If the request returns a status code of `200 OK` with a valid JSON payload containing the user object:
  - The application MUST map the user's numerical backend ID to a string.
  - The application MUST set the authenticated user state.
- If the request returns a non-2xx status code (e.g., `401 Unauthorized`) or fails due to network issues:
  - The application MUST clear the user state (set to `null`).
- The application MUST transition the `loading` state to `false` after the check concludes, regardless of success or failure.

_Scenario: Successful Session Recovery_

- **Given** the browser possesses a valid active session cookie.
- **When** the application mounts and triggers session recovery via `GET /auth/me`.
- **Then** the server MUST respond with `200 OK` and a JSON body containing `{ "id": 101, "email": "user@example.com" }`.
- **And** the application MUST map the ID and set the active user state to `{ id: "101", email: "user@example.com" }`.
- **And** the application MUST transition `loading` to `false`.

_Scenario: No Active Session_

- **Given** the browser does not possess a valid session cookie.
- **When** the application mounts and triggers session recovery via `GET /auth/me`.
- **Then** the server MUST respond with a `401 Unauthorized` status.
- **And** the application MUST set the active user state to `null`.
- **And** the application MUST transition `loading` to `false`.

---

### Requirement: User Login (POST /auth/login)

The system MUST support authentication of existing users via credentials.

- The login operation MUST accept `email` and `password` parameters.
- Input validation MUST be executed client-side before any network request:
  - If `email` does not contain the `@` character, the operation MUST immediately reject with error message `"Ingresá un email válido."` in es-AR locale.
  - If `password` is empty, the operation MUST immediately reject with error message `"Ingresá tu contraseña."` in es-AR locale.
- Validated inputs MUST be forwarded via a `POST` request to `/auth/login` as a JSON payload `{ "email": email, "password": password }`.
- The request MUST contain the headers:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN` with the value of the CSRF token extracted from the `XSRF-TOKEN` cookie.
- If the backend returns `200 OK` with the authenticated user data:
  - The application MUST map the user's numerical ID to a string.
  - The application MUST set the active user state.
- If the backend returns a non-2xx status code (e.g. `401 Unauthorized` or `403 Forbidden`):
  - The operation MUST reject with error message `"Credenciales inválidas."`.

_Scenario: Successful Login_

- **Given** a registered user "test@budgeting.app" with password "supersecret" exists on the backend.
- **When** the user submits email "test@budgeting.app" and password "supersecret" to the login function.
- **Then** the application MUST validate inputs locally.
- **And** the application MUST issue a `POST /auth/login` request with body `{ "email": "test@budgeting.app", "password": "supersecret" }` and header `X-XSRF-TOKEN` matching the client-side `XSRF-TOKEN` cookie.
- **And** the server MUST return `200 OK` with JSON `{ "id": 101, "email": "test@budgeting.app" }`.
- **And** the application MUST update the user state to `{ id: "101", email: "test@budgeting.app" }`.

_Scenario: Failed Login due to Invalid Credentials_

- **Given** a login attempt with invalid credentials.
- **When** the user submits the credentials.
- **Then** the application MUST issue a `POST /auth/login` request.
- **And** the server MUST return `401 Unauthorized`.
- **And** the login operation MUST throw an error containing the message `"Credenciales inválidas."`.
- **And** the user state MUST remain `null`.

---

### Requirement: User Registration (POST /auth/register)

The system MUST support registration of new user accounts.

- The signup operation MUST accept `email` and `password` parameters.
- Input validation MUST be executed client-side before making a network request:
  - If `email` does not contain the `@` character, the operation MUST immediately reject with error message `"Ingresá un email válido."`.
  - If `password` is shorter than 6 characters, the operation MUST immediately reject with error message `"Usá al menos 6 caracteres."`.
- Validated inputs MUST be forwarded via a `POST` request to `/auth/register` as a JSON payload `{ "email": email, "password": password }`.
- The request MUST contain the headers:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN` with the value of the CSRF token extracted from the `XSRF-TOKEN` cookie.
- If the backend returns `200 OK` or `201 Created` with the registered user data:
  - The application MUST map the user's numerical ID to a string.
  - The application MUST automatically log the user in by setting the active user state.
- If the backend returns an error status indicating the user already exists (e.g., `409 Conflict`):
  - The operation MUST reject with error message `"El usuario ya está registrado."`.

_Scenario: Successful Registration_

- **Given** no user with email "new@budgeting.app" is registered in the system.
- **When** the user submits email "new@budgeting.app" and password "supersecret" to the signup function.
- **Then** the application MUST validate the inputs.
- **And** the application MUST issue a `POST /auth/register` request with body `{ "email": "new@budgeting.app", "password": "supersecret" }` and the `X-XSRF-TOKEN` header.
- **And** the server MUST return `200 OK` with JSON `{ "id": 102, "email": "new@budgeting.app" }`.
- **And** the application MUST update the user state to `{ id: "102", email: "new@budgeting.app" }`.

_Scenario: Failed Registration due to Existing User_

- **Given** a user with email "existing@budgeting.app" is already registered.
- **When** the user attempts to sign up with email "existing@budgeting.app" and password "supersecret".
- **Then** the application MUST issue a `POST /auth/register` request.
- **And** the server MUST return `409 Conflict`.
- **And** the signup operation MUST throw an error containing the message `"El usuario ya está registrado."`.
- **And** the user state MUST remain `null`.

---

### Requirement: User Logout (POST /auth/logout)

The system MUST support clearing the active session.

- The logout operation MUST perform a `POST` request to `/auth/logout`.
- The request MUST contain the `X-XSRF-TOKEN` header with the current value of the CSRF token.
- Upon completion of the request (regardless of success or failure status code to ensure UI session release resilience), the frontend MUST reset the authenticated user state to `null`.

_Scenario: Successful Logout_

- **Given** the user is authenticated as `{ id: "101", email: "user@example.com" }`.
- **When** the user triggers the signOut function.
- **Then** the application MUST send a `POST /auth/logout` request with the `X-XSRF-TOKEN` header.
- **And** the server MUST respond with `200 OK` or `204 No Content`.
- **And** the application MUST reset the active user state to `null`.
