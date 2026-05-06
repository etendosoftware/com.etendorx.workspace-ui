---
name: workspace-ui-stack
description: Tech stack, estructura de repositorio y convenciones del proyecto Etendo WorkspaceUI. Consultado por múltiples agentes para entender el contexto del proyecto.
---

# Etendo WorkspaceUI — Tech Stack & Repository Structure

## Tech Stack
- **Framework:** Next.js 14 with App Router
- **UI Library:** Material-UI v5 (@mui/material, @mui/icons-material)
- **Data fetching:** @tanstack/react-query via custom hooks
- **Tables:** @tanstack/react-table
- **Animation:** framer-motion (use sparingly, only if already used in context)
- **Styling:** Tailwind CSS + MUI sx prop + @emotion/styled
- **Monorepo:** pnpm workspaces
- **Typing:** TypeScript strict (no `any`, no unknown casts, explicit types on all signatures)
- **Component library:** packages/ComponentLibrary/ — always check here first
- **Linting/Formatting:** Biome (`pnpm check:fix` from project root)
- **Unit tests:** Jest + Testing Library (`pnpm test:mainui`)
- **E2E tests:** Cypress (`cypress-tests/e2e/`)

## Repository Structure
```
packages/
  MainUI/
    app/                    → Next.js App Router pages and layouts
    components/             → Page-specific React components
    hooks/                  → Custom React hooks (data fetching, state)
    contexts/               → React Context providers
    utils/                  → Utility functions
    screens/                → Screen-level components
    __tests__/              → Unit tests
    __mocks__/              → Jest module mocks
  ComponentLibrary/
    src/                    → Reusable UI components shared across apps
    src/theme/              → MUI theme configuration
  api-client/               → API client (DO NOT modify internals)
cypress-tests/
  cypress.config.js         → baseUrl: http://localhost:3000
  e2e/
    smoke/                  → E2E test suites by category
  support/
    commands.js             → Custom Cypress commands
client/
  docs/                     → Technical documentation
```

## Key Commands
| Command | Purpose |
|---------|---------|
| `pnpm build` | Build the project |
| `pnpm check:fix` | Fix linting/formatting (Biome) |
| `pnpm format:fix` | Apply Biome formatting |
| `pnpm apply:data-testid` | Add data-testid attributes to interactive elements |
| `pnpm test:mainui` | Run MainUI unit tests |
| `pnpm test:mainui -- --testPathPattern="<path>" --no-coverage` | Run specific test file |
| `pnpm test:component-library` | Run ComponentLibrary tests |

## Component Decision Hierarchy
1. Exists in `packages/ComponentLibrary/` → use it
2. Similar component exists in `packages/MainUI/components/` → extend or adapt
3. MUI primitive covers it → build a thin wrapper
4. None of the above → create new component in appropriate directory

## Conventions
- TypeScript strict: no `any`, no `as unknown`, explicit return types on all functions
- Spanish neutral in all UI text ("¿Quieres eliminar?" — never voseo)
- Reusable components go in `packages/ComponentLibrary/src/`; page-specific ones stay in `packages/MainUI/`
- No new npm libraries without checking `root package.json` and `packages/MainUI/package.json` first
- All GitHub interactions in English (PR titles, commits, comments). Everything else in Spanish.
