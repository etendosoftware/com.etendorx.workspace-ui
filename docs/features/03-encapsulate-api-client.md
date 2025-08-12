# PRD-02: Adoption of Zustand and Encapsulation of TanStack Query

**Status:** Proposed  
**Owner:** Development Team  
**Date:** 2025-01-26  
**Priority:** CRITICAL  
**Supersedes:** `PRD-03`, `PRD-04`

## 1. Problem

The application's state management presents two main challenges that impact performance and maintainability:

1.  **Inefficient Server State:** Data fetching is handled by a manual `useDatasource` hook, which lacks caching, request deduplication, and stale data management. This leads to excessive API calls and a UI that doesn't automatically update after mutations.
2.  **Complex Global Client State:** `React.Context` is used extensively for global state (session, UI, etc.), resulting in excessive provider nesting ("Provider Hell") and massive re-renders that degrade performance.

## 2. Proposed Solution

A comprehensive state management refactor is proposed, adopting a dual approach and encapsulating all logic within a new monorepo package: `@workspace/core-logic`.

1.  **For Server State:** **TanStack Query (v5)** will be adopted. All `useQuery` and `useMutation` logic will be encapsulated within custom domain hooks (e.g., `useDatasource`, `useProducts`) inside the new package. These hooks will communicate with the backend via the proxy defined in `PRD-01`.
2.  **For Global Client State:** **Zustand** will be adopted. A centralized store will be created to manage UI state, user sessions, and other non-server states, eliminating the need for multiple Contexts. Access to this store will also be handled via custom hooks.

## 3. Technical Implementation

### 3.1. Create the `@workspace/core-logic` Package

A new package will be created at `packages/core-logic`.

* **`package.json` for `core-logic`:**
    * **Dependencies:** `zustand`, `@tanstack/react-query`, `@workspace/api-client`.
* **`package.json` for `MainUI`:**
    * **Add dependency:** `@workspace/core-logic`.
    * **Remove dependencies:** `zustand`, `@tanstack/react-query`.

### 3.2. Implement Zustand (Session Example)

```typescript
// packages/core-logic/src/state/sessionStore.ts
import { create } from 'zustand';

interface SessionState {
  user: User | null;
  token: string | null;
  login: (data: LoginData) => void;
  // ... more state and actions
}

export const useInternalSessionStore = create<SessionState>((set) => ({ /* ... */ }));

// packages/core-logic/src/hooks/useSession.ts
import { useInternalSessionStore } from '../state/sessionStore';

// Hook for reading data (optimized to prevent re-renders)
export const useSession = () => useInternalSessionStore(state => ({
  user: state.user,
  isAuthenticated: !!state.token
}));

// Hook for actions
export const useSessionActions = () => useInternalSessionStore(state => ({
  login: state.login
}));