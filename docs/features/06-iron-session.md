# **PRD-06: Implementation of Secure Server-Side Sessions with `iron-session`**

### **1. Problem**

The current architecture, while having been prepared for this migration, still manages the user's authentication token on the client side (within the Zustand store). This approach, although functional, presents a fundamental security risk:

* **Token Exposure:** The authentication token, which is the user's primary credential, resides in the browser's memory. This makes it vulnerable to Cross-Site Scripting (XSS) attacks, where a malicious script could steal the token and impersonate the user.
* **Client-Side Complexity:** The logic layer in `@workspace/core-logic` still has the responsibility of reading the token and attaching it to every outgoing request to the API proxies. This adds unnecessary complexity to the client.

This PRD addresses the final phase of the security refactor, completely removing the token from the browser environment.

### **2. Proposed Solution**

The proposal is to adopt **`iron-session`** to manage user sessions securely and exclusively on the server. The authentication token from the ERP will never be sent to the client.

The new flow will be as follows:

1.  **Login:** The client sends credentials to the `/api/auth/login` API route. The server authenticates with the ERP, receives the token, and instead of returning it, stores it in an **encrypted, `httpOnly` cookie** using `iron-session`.
2.  **Authenticated Requests:** In every subsequent request from the client to the API Routes or Server Actions, the browser will automatically attach the session cookie.
3.  **Server-Side Management:** The Next.js server (in API Routes and Server Actions) will use `iron-session` to decrypt the cookie, read the token from the session, and use it to make the secure call to the ERP on the user's behalf.
4.  **Agnostic Client:** The client (both the UI and `@workspace/core-logic`) becomes completely agnostic to the token. Its sole responsibility is to make calls to the Next.js backend endpoints.

This solution builds upon the proxy architecture defined in `PRD-01` and the logic encapsulation from `PRD-03`.

### **3. Technical Implementation**

#### **3.1. Installation and Configuration**

1.  **Install `iron-session`:**
    ```bash
    npm install iron-session
    ```
2.  **Configure Environment Variables:** Add a secret key of at least 32 characters to `.env.local`.
    ```sh
    # .env.local
    SECRET_COOKIE_PASSWORD="<generate-a-secure-32-character-key>"
    ```
3.  **Create the session configuration file:**
    ```typescript
    // lib/session.ts
    import { IronSessionOptions } from 'iron-session';

    export const sessionOptions: IronSessionOptions = {
      password: process.env.SECRET_COOKIE_PASSWORD as string,
      cookieName: 'etendo-workspace-session',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // The cookie is not accessible by client-side JavaScript
      },
    };

    declare module 'iron-session' {
      interface IronSessionData {
        token?: string; // The ERP token will live here
        user?: { id: string; name: string; };
      }
    }
    ```

#### **3.2. Refactor the Login Flow**

The `/api/auth/login` route must be modified to save the token in the session instead of returning it.

```typescript
// app/api/auth/login/route.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
// ... other imports

export async function POST(request: NextRequest) {
  // ... logic to call the ERP and get the login response
  const erpResponse = await fetch(erpLoginUrl, ...);
  const data = await erpResponse.json();

  if (erpResponse.ok) {
    // Save the token in the server-side session
    const session = await getIronSession(cookies(), sessionOptions);
    session.token = data.token; // The ERP token is saved here
    session.user = { id: data.user.id, name: data.user.name };
    await session.save();

    // Return only user information, NEVER the token
    return NextResponse.json({ user: session.user });
  }
  // ... error handling
}
```

#### **3.3. Secure API Routes and Server Actions**

All server-side functions that need to communicate with the ERP must be updated to read the token from the session.

**Example with a Server Action (`executeProcess` from PRD-02):**

```typescript
// app/actions/process.ts
'use server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

export async function executeProcess(processId: string, parameters: Record<string, any>) {
  // 1. Get the session and the token
  const session = await getIronSession(cookies(), sessionOptions);
  const userToken = session.token;

  if (!userToken) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Make the call to the ERP using the server-side token
  const response = await fetch(`${process.env.ETENDO_CLASSIC_URL}/process/${processId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`, // The token is used here
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parameters),
  });

  // ... rest of the logic
}
```

#### **3.4. Simplify Client-Side Logic**

The final step is to remove all token management from the client-side.

1.  **In `@workspace/core-logic`:**

    * **Modify `sessionStore.ts`:** Remove the `token` property from the Zustand state. It is no longer needed on the client.
    * **Modify `useDatasource.ts` (and similar hooks):** Remove the logic that gets the token from the store and passes it to the `api-client`. The `fetch` calls will no longer need the `Authorization` header.

2.  **In `@workspace/api-client`:**

    * Revert the modification that allowed passing an optional token. The client no longer needs to handle tokens, simplifying its logic.

### **4. Success Metrics**

* **Security Metric:** Zero presence of the authentication token in browser storage (`localStorage`, `sessionStorage`) or JavaScript memory, verified with developer tools.
* **Functional Metric:** 100% of features requiring authentication (loading data in grids, executing processes, etc.) must continue to work without regressions.
* **Network Metric:** Browser requests to the Next.js backend must no longer contain an `Authorization` header. Instead, they must include the `etendo-workspace-session` cookie with the `httpOnly` attribute.

### **5. Acceptance Criteria**

- [ ] The `iron-session` dependency has been added to the project.
- [ ] The `lib/session.ts` configuration file has been created, and a secure `SECRET_COOKIE_PASSWORD` has been added to the environment variables.
- [ ] The `/api/auth/login` API route has been refactored to save the token in the session and not return it to the client.
- [ ] All API Routes (e.g., `/api/datasource`) and Server Actions (e.g., `executeProcess`) have been updated to get the token from `getIronSession`.
- [ ] The `token` property has been removed from the Zustand store in `@workspace/core-logic`.
- [ ] The logic for adding the `Authorization` header in the `api-client` and data hooks (`useDatasource`) has been removed.
- [ ] The application is fully functional: login, data loading, and process execution work correctly with the new session system.
- [ ] It has been verified in the browser that the token is no longer visible on the client and that the session cookie is sent correctly.