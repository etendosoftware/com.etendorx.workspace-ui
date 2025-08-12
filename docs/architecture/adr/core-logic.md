# ADR-001: Adopt Zustand and Encapsulate TanStack Query in a Dedicated Logic Package

* **Status:** Proposed
* **Date:** 2025-08-05
* **Deciders:** [Names of the Architecture Team/Technical Leads]

## Context

Our project is a large-scale ERP application developed in a monorepo architecture with well-defined packages such as `MainUI`, `ComponentLibrary`, and `api-client`. Currently, state management is based on two main approaches:

1.  **Global Client-Side State (UI State):** This is managed through React's `Context API`, which has led to excessive provider nesting ("Provider Hell") and performance issues due to unnecessary re-renders in consuming components.
2.  **Server-Side State:** Although TanStack Query (`@tanstack/react-query`) is used, its application is not standardized. Components often import and use `useQuery` directly, coupling the presentation layer with data fetching logic, `queryKey` management, and cache configuration.

This lack of a formal abstraction layer for both state types increases complexity, hinders maintainability, and creates strong coupling with the implementation libraries.

## Decision

To resolve these performance, maintainability, and coupling issues, and to establish a more robust and scalable data and state architecture, a two-part decision has been made:

1.  **For Global Client-Side State:**
    * **Adopt `zustand` as the standard library.** It will be used to manage states that are global to the UI but do not come directly from the server, such as user session state, UI preferences, and the state of complex modals.

2.  **For Server-Side State:**
    * **Standardize and encapsulate `TanStack Query`.** An abstraction layer will be created using custom hooks. Components **will not be allowed** to import `useQuery` or `useMutation` directly. Instead, they will consume specific domain hooks (e.g., `useProducts`, `useSalesOrder`).

3.  **Centralization in a Dedicated Package:**
    * All of this abstraction logic will be centralized in a **new monorepo package named `@workspace/core-logic`**.
    * This package will contain all Zustand stores and all hooks that encapsulate TanStack Query.
    * `packages/MainUI` will **remove its direct dependencies** on `zustand` and `@tanstack/react-query`, and will instead have a single dependency on `@workspace/core-logic`.

## Consequences

### Positive (Benefits)

* **Drastic Performance Improvement:**
    * Zustand eliminates the massive re-renders caused by `useContext` by allowing selective subscriptions.
    * Encapsulating TanStack Query allows for smarter, centralized cache management.
* **Drastic Reduction in Coupling and Technical Debt:** The `MainUI` application becomes implementation-agnostic. If a future decision is made to switch `zustand` for `jotai`, or `react-query` for `SWR`, only the `@workspace/core-logic` package will be modified.
* **Architectural Clarity:** A clean separation is established between the presentation layer (`MainUI`), the state and data logic layer (`core-logic`), and the raw data access layer (`api-client`).
* **Simplified Domain API:** Components will consume simple domain hooks (e.g., `useProducts()`, `useSession()`) instead of the low-level APIs of `useQuery` or `useStore`.
* **Consistency and Enforced Compliance:** The dependency structure prevents the incorrect or direct use of the base libraries in the UI layer.
* **Future Reusability and Scalability:** The `core-logic` package is inherently reusable for future applications within the monorepo (e.g., a customer portal, a mobile app).

### Negative (Costs & Risks)

* **Initial Configuration Complexity:** Requires the initial effort of setting up the new package (`package.json`, `tsconfig.json`, etc.) and adjusting the workspace dependencies. This is a low, one-time cost for an already functional monorepo.
* **Additional Layer of Indirection:** It introduces another layer to the architecture, which may require a developer to navigate through more files to implement a complete feature. This is an acceptable trade-off for the robustness gained.
* **Migration Effort:** A planned effort will be required to gradually migrate the existing logic to the new package.

## Alternative Options Considered

1.  **Continue with the Current Architecture:** Rejected due to the performance and scalability problems already evident in a project of this magnitude. It is not a viable long-term solution.

2.  **Abstraction Without a Dedicated Package (Hooks in `MainUI`):** Rejected because it does not enforce the abstraction (a developer could still import `useQuery` directly) and misses the reusability and architectural clarity benefits of a dedicated package.

3.  **Use Only TanStack Query for all state:** Rejected. Although TanStack Query can manage client state, `zustand` is specifically optimized for it with a simpler API and a different approach that complements, rather than competes with, server state management.
