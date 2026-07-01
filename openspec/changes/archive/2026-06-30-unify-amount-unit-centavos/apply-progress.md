# Apply Progress: Unify Amount Unit on Centavos

This document provides evidence of the TDD (Test-Driven Development) cycles and verification checks performed during the execution of the `unify-amount-unit-centavos` change.

## TDD Cycle Evidence

### Cycle Summary Table

| Phase             | Description                                                                                           | Verification Command                                                            | Status               | Notes                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| **RED Stage**     | Focused test verification of unit and integration test mocks representing backend amount in centavos. | `pnpm test lib/format.test.ts components/screens/capture-screen.test.tsx --run` | 🔴 FAILED (Expected) | Failed with 100x mismatch: expected `3500` & `70000` but received `350000` & `7000000`. |
| **GREEN Stage**   | Conversion implemented in `lib/format.ts` and test suite rerun.                                       | `pnpm test --run`                                                               | 🟢 PASSED            | All 62 tests across 12 test files passed successfully.                                  |
| **Quality Check** | Code formatting validation.                                                                           | `pnpm format:check`                                                             | 🟢 PASSED            | All matched files use Prettier style guidelines.                                        |
| **Quality Check** | Linter validation.                                                                                    | `pnpm lint`                                                                     | 🟢 PASSED            | Executed ESLint on app/components/lib with zero errors/warnings.                        |
| **Quality Check** | TypeScript static type checking.                                                                      | `pnpm exec tsc --noEmit`                                                        | 🟢 PASSED            | Zero compilation errors.                                                                |
| **Quality Check** | Production application build.                                                                         | `pnpm build`                                                                    | 🟢 PASSED            | Optimized Next.js production build succeeded in ~4.7s.                                  |

---

### Phase 1: RED Stage Details

- **Command**: `pnpm test lib/format.test.ts components/screens/capture-screen.test.tsx --run`
- **Output / Failure Snippet**:

  ```
  FAIL  lib/format.test.ts > HttpCaptureService > should send POST request to /transactions/interpret with CSRF token and payload
  AssertionError: expected { …(3) } to deeply equal { …(3) }

  - Expected
  + Received

    {
  -   "amount": 3500,
  +   "amount": 350000,
      "category": "COMIDA",
      "description": "Supermercado Coto",
    }

  FAIL  components/screens/capture-screen.test.tsx > CaptureScreen > creates a local interpretation preview and waits for explicit confirmation before saving
  Error: expect(element).toHaveValue(70000)

  Expected the element to have value:
    70000
  Received:
    7000000
  ```

---

### Phase 2: GREEN Stage Details

- **Command**: `pnpm test --run`
- **Output**:
  ```
   Test Files  12 passed (12)
        Tests  62 passed (62)
     Start at  22:16:39
     Duration  3.86s
  ```

---

### Phase 3: Quality Verification Output

#### Formatter (`pnpm format:check`)

```
$ prettier --check .
Checking formatting...
...
All matched files use Prettier code style!
```

#### Linter (`pnpm lint`)

```
$ eslint app components lib
```

#### Type Check (`pnpm exec tsc --noEmit`)

Passed with exit code 0.

#### Production Build (`pnpm build`)

```
   Creating an optimized production build ...
 ✓ Compiled successfully in 4.7s
   Linting and checking validity of types     ✓ Linting and checking validity of types
   Collecting page data     ✓ Collecting page data
 ✓ Generating static pages (4/4)
   Collecting build traces     ✓ Collecting build traces
   Finalizing page optimization     ✓ Finalizing page optimization
```
