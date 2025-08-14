# Technical Design Document: 04 - Lazy Loading Strategy for Components

**Version:** 1.0
**Author:** Gemini
**Associated PRD:** `PRD-05: Implementation of Lazy Loading for Components`

### 1. Summary and Objective

This document provides the technical specifications for implementing a **lazy loading** (or dynamic import) strategy across the Etendo WorkspaceUI application. The primary objective is to improve initial page load performance by reducing the main JavaScript bundle size.

By deferring the loading of non-critical components until they are actually needed, we will significantly improve key performance metrics like First Contentful Paint (FCP) and Time to Interactive (TTI), resulting in a faster, more responsive user experience.

### 2. Analysis of Current Loading Strategy

The current architecture bundles all required JavaScript for a given page into a single initial download. Heavy components, such as complex modals and data grids, are loaded upfront, even if the user never triggers the action to display them.

**Current Flow:**
1.  User navigates to a page.
2.  Browser downloads the entire JavaScript bundle for that page, including all possible components (visible and hidden).
3.  Browser parses and executes all JavaScript.
4.  Page becomes interactive.

This leads to unnecessarily long load times and increased memory consumption, as outlined in the associated PRD.

### 3. Proposed Architecture (Lazy Loading Pattern)

We will adopt a code-splitting strategy using the `next/dynamic` API. This will create separate JavaScript chunks for designated components. These chunks will only be downloaded from the server when the component is about to be rendered on the client side.

**Proposed Flow:**
1.  User navigates to a page.
2.  Browser downloads a minimal, essential JavaScript bundle.
3.  Page becomes interactive very quickly.
4.  User performs an action (e.g., clicks a button to open a modal).
5.  The browser then downloads the specific JavaScript chunk for that modal.
6.  A loading skeleton is displayed while the chunk is fetched.
7.  The modal component renders.

This pattern ensures that users only pay the performance cost for the components they actually use.

### 4. Detailed Implementation

#### **Step 4.1: Identification of Candidate Components**

Based on the PRD, the following components from the codebase are primary candidates for lazy loading:

* **Modals:**
    * `ProcessDefinitionModal`
    * `ConfigurationModal`
    * `CopilotPopup`
    * `DragModal`
    * `NotificationsModal`
* **Complex Grid Views:**
    * `WindowReferenceGrid`
    * `DynamicTable` (when used in sub-tabs or non-primary views)
* **Heavy UI Sections:**
    * The content of `Tab` components that are not active by default.
    * The `Sidebar` component in the main table view.
* **Large Third-Party Libraries (if applicable):** Any charting or rich-text editor libraries that are not used on every page.

#### **Step 4.2: Creation of Loading Skeletons**

To ensure a smooth user experience and prevent Cumulative Layout Shift (CLS), we will create placeholder/skeleton components for each dynamically imported component.

**File to Create:** `packages/MainUI/components/Skeletons.tsx`
```typescript
// packages/MainUI/components/Skeletons.tsx

// A simple skeleton for any modal
export const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg p-8">
      <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="mt-2">Loading...</p>
    </div>
  </div>
);

// A skeleton for a data grid
export const GridSkeleton = () => (
  <div className="w-full h-full p-4 bg-gray-100 rounded-lg animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-6 bg-gray-200 rounded w-5/6"></div>
  </div>
);
````

#### **Step 4.3: Creating a Centralized Dynamic Components File**

As proposed in the PRD, we will centralize our dynamic imports for better organization.

**File to Create:** `packages/MainUI/components/LazyComponents.ts`

```typescript
// packages/MainUI/components/LazyComponents.ts
import dynamic from 'next/dynamic';
import { ModalSkeleton, GridSkeleton } from './Skeletons';

// Example for ProcessDefinitionModal
export const LazyProcessDefinitionModal = dynamic(
  () => import('./ProcessModal/ProcessDefinitionModal'),
  {
    // Display a skeleton while the component chunk is being downloaded
    loading: () => <ModalSkeleton />,
    // Disable Server-Side Rendering (SSR) for this component as it's client-interactive
    ssr: false,
  }
);

// Example for WindowReferenceGrid
export const LazyWindowReferenceGrid = dynamic(
  () => import('./ProcessModal/WindowReferenceGrid'),
  {
    loading: () => <GridSkeleton />,
    ssr: false,
  }
);

// Example for the main Copilot Popup
export const LazyCopilotPopup = dynamic(
  () => import('@workspaceui/componentlibrary/src/components/Copilot/CopilotPopup'),
  {
    loading: () => <ModalSkeleton />, // Reusing the same skeleton
    ssr: false,
  }
);
```

#### **Step 4.4: Refactoring Parent Components to Use Lazy Components**

Parent components will be updated to conditionally render the lazy-loaded components. This ensures the JavaScript is only fetched when needed.

**File to Modify:** Example of a component that opens the process modal.

```jsx
// Example Parent Component
'use client';

import { useState } from 'react';
// Import the LAZY version, not the original component
import { LazyProcessDefinitionModal } from '@/components/LazyComponents';

export function ProcessToolbarButton({ processId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Execute Process
      </button>

      {/* The component is only mounted (and thus downloaded) when isModalOpen is true */}
      {isModalOpen && (
        <LazyProcessDefinitionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          // ... other necessary props
        />
      )}
    </>
  );
}
```

### 5\. Tooling and Verification

* **Bundle Analysis:** We will use `@next/bundle-analyzer` to verify that the code splitting is working as expected. After running `npm run build`, the analyzer report should clearly show separate chunks for each component wrapped in `next/dynamic`.
* **Network Tab:** In the browser's developer tools, we will confirm that the JS chunks for lazy components are only downloaded upon user interaction (e.g., clicking a button).
* **React DevTools Profiler:** We will use the profiler to ensure that the loading skeletons are rendered efficiently and that the transition to the full component is smooth without causing performance spikes.

### 6\. Testing Strategy

* **Unit/Integration Tests (React Testing Library):** Tests for parent components that render lazy components will need to be adapted. The lazy component will initially render its `fallback`/`loading` state. We must use `waitFor` or `findBy*` queries to assert that the full component appears after the asynchronous import resolves.
* **End-to-End (E2E) Tests:** E2E tests should be updated with appropriate waits to ensure that the lazy component has fully loaded before attempting to interact with elements inside it.

### 7\. Implementation Checklist

- [ ] Identify and list the top 5-10 heavy components that are candidates for lazy loading.
- [ ] Create appropriate `Skeleton` components for a smooth loading experience for each identified component.
- [ ] Create a central `LazyComponents.ts` file and implement the `next/dynamic` imports for the candidate components.
- [ ] Refactor the parent components to conditionally render the new `Lazy` versions.
- [ ] Run `npm run build` and use `@next/bundle-analyzer` to confirm that the components have been split into separate JavaScript chunks.
- [ ] Manually test the application to ensure functionality is correct and the user experience is smooth during loading, with no layout shifts.
- [ ] Update the architecture documentation to include the new lazy loading pattern.

<!-- end list -->
