# **Technical Design Document: 03 - State Management and Data Fetching Refactor (Phase 1: Encapsulation)**

**Version:** 1.1 (Revised for Phased Migration)
**Author:** Gemini
**Associated PRD:** `PRD-02: Adoption of Zustand and Encapsulation of TanStack Query`

### **1. Summary and Objective**

This document outlines the technical implementation for a critical architectural refactor of the application's state management and data-fetching layers. The primary goal is to **address immediate performance and maintainability issues while preparing the codebase for a future migration to a server-side session model**.

This will be achieved by:

1.  **Adopting Zustand** for global client-side state, including the user's session and token, replacing React Context.
2.  **Encapsulating TanStack Query** behind custom hooks for all server-side state.
3.  **Creating a dedicated monorepo package, `@workspace/core-logic`**, to house these abstractions.

This strategy will immediately solve the "Provider Hell" and data-fetching inefficiencies, while isolating the current client-side token management, making its future removal simple and contained.

### **2. Analysis of Current Architecture**

The current architecture suffers from two main issues:

* **Client State:** A "Provider Hell" of nested React Contexts causes excessive re-renders throughout the application.
* **Server State:** Manual data fetching lacks caching, deduplication, or background refetching, leading to poor performance and a stale UI.

### **3. Proposed Architecture (Phase 1: Encapsulation)**

This architecture establishes a clean separation of concerns. The `MainUI` package will become agnostic to the state management libraries and the authentication mechanism. **For this phase, the authentication token will reside within the Zustand store**.

**Proposed Architecture Diagram (Phase 1):**

```
[UI Component in MainUI]
|
+--> [Custom Hooks from @workspace/core-logic] (e.g., useSession, useDatasource)
|     |
|     +--> [Zustand Store] (Manages client state AND the user's token)
|     |
|     +--> [TanStack Query Hooks]
|           |
|           '--> [api-client] (Receives token from the hook)
|                 |
|                 '--> [/api/... Proxy] (Receives request with Auth header)
|                       |
|                       '--> [Etendo ERP]
```

### **4. Detailed Implementation**

#### **Step 4.1: Monorepo Package Setup**

A new package will be created to enforce the abstraction layer.

1.  **Create Directory:** Create `packages/core-logic`.
2.  **Initialize `package.json`:**
    ```json
    // packages/core-logic/package.json
    {
      "name": "@workspace/core-logic",
      "version": "1.0.0",
      "main": "./src/index.ts",
      "dependencies": {
        "zustand": "^4.5.2",
        "@tanstack/react-query": "^5.45.1",
        "@workspace/api-client": "1.0.0"
      }
    }
    ```
3.  **Update `MainUI` Dependencies:**
    ```json
    // packages/MainUI/package.json
    "dependencies": {
      // ADD this line
      "@workspace/core-logic": "1.0.0",
      // ...
    },
    "devDependencies": {
      // REMOVE these if they exist
      // "zustand": "...",
      // "@tanstack/react-query": "..."
    }
    ```
4.  **Configure TypeScript Paths:** Update the root `tsconfig.json`.
    ```json
    // tsconfig.json
    "paths": {
      "@/core-logic/*": ["packages/core-logic/src/*"],
      // ...
    }
    ```

#### **Step 4.2: Implementing Zustand for Client State (with Token)**

The Zustand store will now be the single source of truth for session state on the client.

1.  **Create the Store:**

    ```typescript
    // packages/core-logic/src/state/sessionStore.ts
    import { create } from 'zustand';
    import { User, LoginData, authentication } from '@workspace/api-client';

    interface SessionState {
      user: User | null;
      token: string | null; // The token will live here for now
      login: (data: LoginData) => Promise<void>;
      logout: () => void;
    }

    export const useInternalSessionStore = create<SessionState>((set) => ({
      user: null,
      token: null,
      login: async (loginData) => {
        const response = await authentication.login(loginData);
        // On success, store user and token in the state
        set({ user: response.user, token: response.token });
      },
      logout: () => {
        set({ user: null, token: null });
      },
    }));
    ```

2.  **Create Abstraction Hooks:**

    ```typescript
    // packages/core-logic/src/hooks/useSession.ts
    import { useInternalSessionStore } from '../state/sessionStore';

    // Hook for components to read data
    export const useSession = () => useInternalSessionStore(state => ({
      user: state.user,
      isAuthenticated: !!state.token,
    }));

    // Hook for actions, prevents re-renders in components that only need to call actions
    export const useSessionActions = () => useInternalSessionStore(state => ({
      login: state.login,
      logout: state.logout,
    }));
    ```

#### **Step 4.3: Encapsulating TanStack Query (with Token)**

1.  **Configure `QueryClientProvider`:** This remains in `MainUI` as it's part of the root layout setup.

2.  **Modify `api-client` to accept a token per request:** This makes the client more flexible and allows our hook to provide the token.

    ```typescript
    // packages/api-client/src/api/client.ts (Modification)
    // Add an optional token parameter to the request method
    public async request(url: string, options: ClientOptions = {}, token?: string) {
      // ...
      const finalHeaders = { ...this.baseHeaders, ...options.headers };
      if (token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(destination, {
        // ...
        headers: finalHeaders,
      });
      // ...
    }
    ```

3.  **Refactor `useDatasource` Hook:** This hook will live in `core-logic` and will be responsible for getting the token from the Zustand store and passing it to the `api-client`.

    ```typescript
    // packages/core-logic/src/hooks/data/useDatasource.ts
    import { useQuery } from '@tanstack/react-query';
    import { datasource } from '@workspace/api-client';
    import { useInternalSessionStore } from '../../state/sessionStore';

    export function useDatasource({ entity, params }) {
      // Get the token directly from the store's state for the query function
      const token = useInternalSessionStore.getState().token;

      return useQuery({
        // The query key is unique for the data, including the token
        queryKey: ['datasource', entity, params],
        
        queryFn: async () => {
          if (!token) {
            throw new Error("Authentication token not available.");
          }
          // The API client's `get` method needs to be adapted to pass the token
          const response = await datasource.get(entity, params, token); // Pass token here
          
          if (response.status >= 400) {
            throw new Error((response.data as any)?.error || 'Network response was not ok');
          }
          return response.data;
        },
        enabled: !!entity && !!token, // The query will not run until the entity and token are defined
      });
    }
    ```

### **5. Path to the Future: How This Prepares for `iron-session`**

This encapsulation strategy makes the future migration straightforward and low-risk. When the time comes to move the token to the server:

* **Current State:** The token lives in the Zustand store. `useDatasource` (in `core-logic`) reads it and passes it to the `api-client`, which adds the `Authorization` header for the proxy. **`MainUI` components are already decoupled.**

* **Future Migration Steps:**

    1.  **Backend (`MainUI`):** Implement `iron-session` in the Next.js API Routes/Server Actions. The proxies (`/api/datasource`, etc.) will now read the token from the secure server-side session instead of expecting it in a header.
    2.  **Logic (`@workspace/core-logic`):**
        * In `sessionStore.ts`, **remove the `token` property** from the state. The client no longer needs it.
        * In `useDatasource.ts`, **remove the logic that gets the token**. The call to the `api-client` will be simplified, as it no longer needs to pass a token.
    3.  **UI (`MainUI`):** **No changes required.** Components will continue to use `useDatasource` and `useSession` exactly as before. They will remain completely unaware of the underlying change in the authentication mechanism.

The refactor becomes a localized change within the backend and the `core-logic` package, with zero impact on the presentation layer.

### **6. Implementation Checklist**

- [ ] Create the `packages/core-logic` package and configure dependencies and `tsconfig.json`.
- [ ] Implement the `QueryClientProvider` in `MainUI`.
- [ ] **Pilot Migration (Current Phase):**
    - [ ] Create the Zustand `sessionStore` in `core-logic` to manage `user` and `token`.
    - [ ] Create abstraction hooks (`useSession`, `useSessionActions`).
    - [ ] Refactor `UserContext` consumers to use the new hooks.
- [ ] Adapt the `api-client` to optionally accept a token for individual requests.
- [ ] Move and refactor `useDatasource` into `core-logic` to use `useQuery` and pass the token from the Zustand store.
- [ ] Verify components function correctly and that data is cached via `ReactQueryDevtools`.
- [ ] Update developer documentation to mandate the use of hooks from `@workspace/core-logic`.