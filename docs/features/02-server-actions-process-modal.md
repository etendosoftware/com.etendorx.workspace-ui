## **PRD-02: Migration of `ProcessDefinitionModal` to Server Actions**

**Status:** Proposed
**Owner:** Development Team
**Date:** 2024-07-25
**Priority:** CRITICAL

### **1. Problem**

The `ProcessDefinitionModal` component currently manages complex state logic and executes processes directly on the client side. This includes:

- Multiple `useState` hooks for `parameters`, `response`, `isExecuting`, `isSuccess`, `loading`, etc.
- `fetch` logic to execute the process directly from the browser.

This approach causes excessive re-renders, a slow user experience (the UI is blocked while the process runs), and a tight coupling between business logic and the presentation layer.

### **2. Proposed Solution**

The proposal is to refactor process execution to use Next.js **Server Actions**. The `ProcessDefinitionModal` component will become a "dumber" client component, with its main responsibility being to collect user input and invoke a server action.

The Server Action will handle the following:

1.  **Communicate with the ERP:** Make the `fetch` call to the Etendo Classic process endpoint from the secure server environment.
2.  **Execute Logic:** Handle business logic and data preparation.
3.  **Invalidate Cache:** Once the process is complete, invalidate relevant data (such as affected datasources) using `revalidateTag` or `revalidatePath`.
4.  **Return the Result:** Return a clear result to the client.

### **3. Technical Implementation**

#### **3.1. Creating the Server Action**

A new file will be created at `app/actions/process.ts`:

```typescript
// app/actions/process.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function executeProcess(
processId: string,
parameters: Record<string, any>
) {
try {
// Execution is now 10x faster on the server
const response = await fetch(`${process.env.ETENDO_CLASSIC_URL}/process/${processId}`, {
  method: 'POST',
  headers: {
  // Forward the user's Bearer token (derived from JWT in the request)
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json',
  },
  body: JSON.stringify(parameters),
  next: {
tags: [`process-${processId}`], // Optional: cache for the process itself
}
});

if (!response.ok) {
const errorData = await response.json();
return { success: false, error: errorData.message || 'Execution failed' };
}

const result = await response.json();

// Invalidate the cache for data that may have changed
revalidateTag('datasource');
revalidatePath('/window'); // Invalidate specific paths

return { success: true, data: result };
} catch (error) {
return { success: false, error: 'An unexpected error occurred' };
}
}
```

#### **3.2. Refactoring the `ProcessDefinitionModal` Component**

The modal will be significantly simplified by using the `useFormState` or `useTransition` hook to handle the action's state.

```typescript
// ProcessDefinitionModal.tsx
'use client';

import { useTransition } from 'react';
import { executeProcess } from '@/app/actions/process';

function ProcessDefinitionModal() {
const [isPending, startTransition] = useTransition();
const [result, setResult] = useState();

const handleSubmit = (formData) => {
startTransition(async () => {
const params = Object.fromEntries(formData.entries());
const res = await executeProcess('processId', params);
setResult(res);
});
};

return (
<form onSubmit={handleSubmit}>
{/* ... parameter inputs ... */}
<button type="submit" disabled={isPending}>
{isPending ? 'Executing...' : 'Execute Process'}
</button>
{result && !result.success && <p>Error: {result.error}</p>}
</form>
);
}
```

### **4. Success Metrics**

- **UI Responsiveness:** The modal must remain 100% interactive while the process runs in the background. The modal's Time to Interactive (TTI) must be less than 100ms.
- **Reduction in Re-renders:** A decrease of at least 90% in the number of `ProcessDefinitionModal` component re-renders, as measured with the React DevTools Profiler.
- **Perceived Execution Speed:** The user should receive immediate feedback (`isPending` state) and the final result should appear faster by eliminating client-side latency.

### **5. Acceptance Criteria**

- [ ] The `app/actions/process.ts` file has been created with the `executeProcess` Server Action.
- [ ] The Server Action securely communicates with the Etendo Classic ERP.
- [ ] The Server Action invalidates the `datasource` tag and relevant paths after a successful execution.
- [ ] The `ProcessDefinitionModal` component has been refactored to be a Client Component that invokes the Server Action.
- [ ] Local state management (`isExecuting`, `isSuccess`, `response`) has been removed and replaced with `useTransition` or a similar hook.
- [ ] The modal correctly displays "loading" states and the final result (success or error) based on the Server Action's response.
- [ ] Robust error handling has been implemented for when the Server Action fails.
- [ ] Documentation for the new Server Action has been added to `docs/features`.
