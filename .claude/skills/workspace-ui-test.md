---
name: workspace-ui-test
description: Framework de testing, comandos, patrones y convenciones para unit tests en Etendo WorkspaceUI. Usado por Unitas cuando el diff es .tsx/.ts.
---

# Etendo WorkspaceUI — Unit Testing Guide

## Test Commands
```bash
# Run specific file
pnpm test:mainui -- --testPathPattern="<relative-path-from-root>" --no-coverage

# Run component library tests
pnpm test:component-library -- --testPathPattern="<relative-path-from-root>" --no-coverage

# Run all MainUI tests
pnpm test:mainui
```

## Test File Location
For each changed file, look for existing tests at:
- `<same-dir>/__tests__/<ComponentName>.test.tsx`
- `packages/MainUI/__tests__/<path>/`

Always read existing test files fully before modifying.

## Coverage Priority Order
1. Empty/null/zero edge cases — what happens when data is missing
2. Error states — failed fetches, invalid inputs, error boundaries
3. Loading states — skeleton screens, disabled buttons, spinners
4. Happy path — renders correctly with valid props
5. User interactions — clicks, input changes, form submissions
6. Conditional rendering — items shown/hidden based on props or state

## Strict Rules
- NEVER modify source code. If source prevents testing, report as BLOCKER.
- No unused variables or imports in test files
- One logical assertion per `it()` block where possible
- Use screen queries: `getByRole`, `getByText`, `findByRole` — avoid `getByTestId` unless unavoidable
- Prefer `userEvent` over `fireEvent` for interaction tests
- Deterministic: no `Math.random()`, no unseeded date generation
- `jest.useFakeTimers()` for debounce or timeout tests
- `jest.clearAllMocks()` in `beforeEach`

## No Code Duplication (strictly enforced)
- Never repeat render/mock setup across `it()` blocks → extract to `beforeEach` or helper
- Never copy-paste `it()` blocks changing only data → use `test.each`
- Never duplicate mock definitions across files → extract to `_test-utils/` helper
- Render wrappers used in 2+ `it()` blocks → extract to `const` or `_test-utils/`

## File Naming
- `<ComponentName>.test.tsx` or `<hookName>.test.ts`
- Place in `__tests__/` adjacent to source, or `packages/MainUI/__tests__/<path>/`

## License Header (required on ALL new test files)
```
/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * ...
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 *************************************************************************
 */
```

## Required Imports for Component Tests
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
```

## Render Wrapper Pattern
```tsx
const renderWithTheme = (component) => render(
  <ThemeProvider theme={theme}>{component}</ThemeProvider>
);
```
Extract to `packages/MainUI/<feature>/_test-utils/` when used in 2+ files.

## Helper File Placement
- MUST NOT be inside any `__tests__/` directory
- Place in: `packages/MainUI/<feature-area>/_test-utils/` (preferred)
- Or: `packages/MainUI/__mocks__/` (for module-level mocks)

## Context Mocking Pattern
```tsx
jest.mock("../../../contexts/SomeContext");
// in beforeEach:
(useSomeContext as jest.MockedFunction<typeof useSomeContext>).mockReturnValue({ ... });
```

## Common Auto-Mocked Modules
- `@workspaceui/api-client` → `packages/MainUI/__mocks__/@workspaceui/api-client.ts`
- `@/utils/logger` → `packages/MainUI/__mocks__/@/utils/logger.ts`

## Hook Testing
Use `renderHook` from `@testing-library/react`.

## Common Failures and Fixes
| Failure | Fix |
|---------|-----|
| Cannot find module '@/...' | Check tsconfig paths; use full import or alias |
| Element not found | Use `findBy*` (async) instead of `getBy*` |
| act() warnings | Wrap in `await act(async () => {...})` |
| Context missing | Add required provider to renderWithTheme wrapper |
| mockReturnValue not applied | Move mock setup into beforeEach after `jest.clearAllMocks()` |
| Timer-based failures | `jest.useFakeTimers()` + `jest.runAllTimers()` |
| hooks can only be called inside component | Use `renderHook` from @testing-library/react |

## Commit Format
```
Feature ETP-XXXX: [tests] add unit tests for <description>

Co-Authored-By: Unitas <noreply@anthropic.com>
```
HARD LIMIT: Subject ≤80 chars. "Feature ETP-XXXX: [tests] " is 26 chars → max 54 for description.
