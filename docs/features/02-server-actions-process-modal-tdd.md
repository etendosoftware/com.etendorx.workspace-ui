# Technical Design Document: 02 - Refactoring Process Execution with Server Actions

**Associated PRD:** `PRD-02: Migration of ProcessDefinitionModal to Server Actions`

### 1. Summary and Objective

This document provides the detailed technical design for refactoring the client-side process execution logic into a server-centric model using **Next.js Server Actions**. The primary goal is to move the business logic and direct ERP communication for processes from the `ProcessDefinitionModal` component to a secure, non-blocking, and maintainable server-side function.

This change will improve UI responsiveness, enhance security, and simplify the client-side component by decoupling it from the execution logic.

### 2. Analysis of Current Flow (Client-Side Execution)

The current implementation is a "fat client" pattern. The `ProcessDefinitionModal` component is responsible for managing loading states, handling errors, and initiating the `fetch` request directly from the browser to the Etendo ERP.

**Current Flow Diagram:**
```

[ProcessDefinitionModal (Client)] -\> [Manages State (useState)] -\> [fetch (Browser)] -\> [Etendo ERP]

```

**Problems with this approach:**
* **UI Blocking:** The main thread can be blocked during the request, making the UI unresponsive.
* **Logic Coupling:** Business logic is tightly coupled with the view, making it harder to maintain and test.
* **Security:** Direct communication from the browser exposes the ERP endpoint and potentially sensitive logic.

### 3. Proposed Architecture (Server Action Flow)

The new architecture will leverage Next.js Server Actions. The client component's role will be reduced to collecting form data and invoking the action. The server will handle the entire process execution lifecycle.

**Proposed Flow Diagram:**
```

[Client Component] -\> [Invokes Server Action] -\> [Server Action (Node.js Environment)] -\> [fetch (Server)] -\> [Etendo ERP]

````

**Benefits of this architecture:**
* **Non-Blocking UI:** The `useTransition` hook allows the UI to remain interactive while the action executes.
* **Secure Execution:** The ERP URL and server tokens are never exposed to the browser.
* **Centralized Logic:** The process execution logic is centralized in one place, easy to manage and test.

### 4. Detailed Implementation

#### **Step 4.1: Server Action Implementation (`process.ts`)**

The core of the server-side logic will reside in a new Server Action file. This function will be responsible for authenticating, communicating with the ERP, and handling cache invalidation.

**File to Create:** `app/actions/process.ts`
```typescript
// app/actions/process.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { logger } from '@/utils/logger'; // Assuming a logger utility exists

// This function will only ever run on the server.
export async function executeProcess(
  processId: string,
  parameters: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const erpProcessUrl = `${process.env.ETENDO_CLASSIC_URL}/process/${processId}`;
    
    // Securely fetch data from the ERP by forwarding the user's Bearer token (JWT-derived).
    const response = await fetch(erpProcessUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parameters),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Execution failed' }));
      logger.error(`ERP process execution failed for processId: ${processId}`, errorData);
      return { success: false, error: errorData.message || 'Process execution failed' };
    }

    const result = await response.json();

    // After a successful mutation, invalidate the cache for related data.
    // This will trigger TanStack Query on the client to refetch.
    revalidateTag('datasource');
    revalidatePath('/window'); // Example: invalidate all window pages

    logger.info(`Process ${processId} executed successfully.`);
    return { success: true, data: result };

  } catch (error) {
    logger.error(`Server Action error for processId: ${processId}`, error);
    return { success: false, error: 'An unexpected server error occurred' };
  }
}
````

#### **Step 4.2: Refactoring the Client Component (`ProcessDefinitionModal.tsx`)**

The component will be refactored to be a Client Component (`'use client'`) that is much simpler. It will use the `useTransition` hook to manage the pending state of the server action without blocking user interactions.

**File to Modify:** `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx`

```typescript
// ProcessDefinitionModal.tsx
'use client';

import { useState, useTransition } from 'react';
import { executeProcess } from '@/app/actions/process'; // Import the server action

// The component is now significantly simpler
function ProcessDefinitionModal({ processId, initialParams, onClose }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parameters = Object.fromEntries(formData.entries());

    // Wrap the server action call in startTransition
    startTransition(async () => {
      const res = await executeProcess(processId, parameters);
      setResult(res);

      // If successful, you might close the modal after a delay
      if (res.success) {
        setTimeout(() => onClose(), 1500);
      }
    });
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* ... render your parameter inputs here ... */}
      
      <div className="action-buttons">
        <button type="button" onClick={onClose} disabled={isPending}>Cancel</button>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Executing...' : 'Execute Process'}
        </button>
      </div>

      {result && !result.success && <p className="error-message">Error: {result.error}</p>}
      {result && result.success && <p className="success-message">Process completed successfully!</p>}
    </form>
  );
}
```

### 5\. Integration with TanStack Query and Caching

This Server Action architecture integrates perfectly with the state management decisions from `PRD-03`.

1.  **Mutation via Server Action:** The user triggers a mutation by submitting the form, which calls `executeProcess`.
2.  **Server-Side Invalidation:** The `executeProcess` action, upon success, calls `revalidateTag('datasource')`.
3.  **Automatic Client-Side Refetch:** This server-side invalidation signals to Next.js to clear its data cache. TanStack Query, running on the client, detects this and automatically marks the relevant queries as stale. It then refetches the updated data by calling the `useDatasource` hook, which hits our cached `/api/datasource` proxy.

This creates a seamless, end-to-end reactive system: **Mutation (Server Action) -\> Invalidation -\> Automatic Refetch (TanStack Query)**.

### 6\. Testing Strategy

1.  **Server Action Testing (`executeProcess`):**

    * Unit test the action in isolation using Jest.
    * Mock the global `fetch` function to simulate successful and failed responses from the ERP.
    * Mock `revalidateTag` and `revalidatePath` from `next/cache` to ensure they are called on success.
    * Test that the function returns the correct `{ success, error/data }` object in all scenarios.

2.  **Client Component Testing (`ProcessDefinitionModal`):**

    * Test the component using React Testing Library.
    * Mock the `executeProcess` server action using `jest.mock`.
    * Simulate form submission.
    * Assert that the component correctly displays the `isPending` state (e.g., disabled button with "Executing..." text).
    * Test the success case: assert that the success message is displayed when the mocked action returns `{ success: true }`.
    * Test the error case: assert that the error message is displayed when the mocked action returns `{ success: false, error: '...' }`.

### 7\. Implementation Checklist

- [ ] The `app/actions/process.ts` file is created with the `executeProcess` Server Action.
- [ ] The Server Action correctly calls the ERP endpoint using server-only environment variables.
- [ ] The Server Action calls `revalidateTag` and/or `revalidatePath` on successful execution.
- [ ] The `ProcessDefinitionModal` component is refactored to be a Client Component (`'use client'`).
- [ ] All local state related to loading and results (`isExecuting`, `isSuccess`, `response`) is removed from the modal.
- [ ] The `useTransition` hook is implemented to handle the pending state.
- [ ] The modal correctly displays loading/pending states and the final result (success or error) from the action.
- [ ] Unit tests for the Server Action and integration tests for the component are implemented.
