# **Technical Design Document: 06 - Secure Server-Side Session Implementation with `iron-session`**

**Associated PRD:** `PRD-06: Implementation of Secure Server-Side Sessions with iron-session`

### **1. Summary and Objective**

This document details the technical implementation for migrating the application's authentication mechanism from a client-side token model to a secure, server-centric session model using **`iron-session`**.

The primary objective is to **completely remove the authentication token from the client-side environment**. This will be achieved by storing the token received from the Etendo ERP within an encrypted, `httpOnly` cookie. All server-side logic (API Routes and Server Actions) will be refactored to read the token from this secure session, making the client application entirely agnostic to the authentication token, thereby significantly enhancing security.

This TDD represents the final phase of the security refactor, building upon the encapsulated architecture established in `TDD-03`.

### **2. Analysis of Current Architecture (Pre-Migration State)**

The current architecture, prepared via `TDD-03`, has successfully encapsulated data and state logic within the `@workspace/core-logic` package. However, it still operates with the authentication token managed on the client side, specifically within a Zustand store.

**Current Flow Diagram:**

```
[UI Component] -> [Hook in @workspace/core-logic] -> [Zustand Store (reads token)] -> [api-client (adds Auth header)] -> [Next.js Proxy] -> [ERP]
```

**Problem:** The authentication token, although abstracted, still resides in the browser's memory. This remains the primary security vulnerability, as it is susceptible to being stolen via Cross-Site Scripting (XSS) attacks.

### **3. Proposed Architecture (Server-Side Session Flow)**

The new architecture will ensure the token never leaves the server. The client will only possess an opaque, encrypted session cookie that it cannot read.

**Proposed Flow Diagram:**

```
[Client (sends encrypted cookie automatically)]
| 1. Invokes API Route or Server Action (No token is handled by the client).
V
[Next.js Server (API Route / Server Action)]
| 2. Uses `iron-session` to decrypt the cookie and read the session data.
| 3. Extracts the ERP Bearer Token from the session.
| 4. Makes a secure, server-to-server `fetch` call to the Etendo ERP, using the token.
V
[Etendo ERP]
| 5. Validates token, executes logic, returns data to Next.js Server.
V
[Next.js Server]
| 6. Returns data/status to the client.
```

### **4. Detailed Implementation**

#### **Step 4.1: Dependency and Configuration**

1.  **Install `iron-session`:**

    ```bash
    npm install iron-session
    ```

2.  **Add Secret Key to Environment:** A strong secret key of at least 32 characters is required.

    ```sh
    # .env.local
    # Generate a secure secret using: openssl rand -base64 32
    SECRET_COOKIE_PASSWORD="your-secure-secret-password-of-at-least-32-characters"
    ```

3.  **Create Session Configuration File:**
    **File to Create:** `lib/session.ts`

    ```typescript
    import type { IronSessionOptions } from 'iron-session';

    export const sessionOptions: IronSessionOptions = {
      password: process.env.SECRET_COOKIE_PASSWORD as string,
      cookieName: 'etendo-workspace-session',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Crucial for security: prevents access from client-side JS
      },
    };

    // Augment the IronSessionData type to include our session data
    declare module 'iron-session' {
      interface IronSessionData {
        token?: string; // This is where the ERP token will be stored
        user?: {
          id: string;
          name: string;
        };
      }
    }
    ```

#### **Step 4.2: Refactor the Authentication Flow**

The login API route will now set the session cookie instead of returning the token.

**File to Modify:** `app/api/auth/login/route.ts`

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const erpLoginUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/login`;

    const erpResponse = await fetch(erpLoginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await erpResponse.json();

    if (!erpResponse.ok) {
      return NextResponse.json({ error: data.error || 'Login failed' }, { status: erpResponse.status });
    }

    // ---- START CHANGE ----
    // Save the received token into the secure server-side session
    const session = await getIronSession(cookies(), sessionOptions);
    session.token = data.token; // The token from Etendo ERP
    session.user = { id: data.user.id, name: data.user.name };
    await session.save();

    // Return only public user info, NEVER THE TOKEN
    return NextResponse.json({ user: session.user });
    // ---- END CHANGE ----

  } catch (error) {
    // ... error handling
  }
}
```

#### **Step 4.3: Secure Server-Side Endpoints**

All API Routes and Server Actions must be modified to get the token from the session.

**Example File to Modify:** `app/api/datasource/route.ts`

```typescript
// app/api/datasource/route.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
// ... other imports

// The cached function now only needs the token, not the full user context object
const getCachedDatasource = unstable_cache(
  async (userAuthToken: string, entity: string, params: any) => {
    // ... fetch logic remains the same inside
  },
  ['datasource_v5']
);

export async function POST(request: NextRequest) {
  try {
    // ---- START CHANGE ----
    // Get token from the session, not from the Authorization header
    const session = await getIronSession(cookies(), sessionOptions);
    const userAuthToken = session.token;

    if (!userAuthToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ---- END CHANGE ----

    const { entity, params } = await request.json();
    // ...

    const data = await getCachedDatasource(userAuthToken, entity, params);
    return NextResponse.json(data);
  } catch (error) {
    // ... error handling
  }
}
```

#### **Step 4.4: Simplify Client-Side Logic (`@workspace/core-logic`)**

This is the final cleanup phase, removing all token awareness from the client.

1.  **Remove Token from Zustand Store:**
    **File to Modify:** `packages/core-logic/src/state/sessionStore.ts`

    ```typescript
    // Before:
    // interface SessionState { token: string | null; ... }
    // After:
    interface SessionState {
      user: User | null;
      // The 'token' property is now removed.
      login: (data: LoginData) => Promise<void>;
      logout: () => void;
    }
    ```

2.  **Simplify Data Fetching Hooks:** Remove the logic that retrieves and passes the token.
    **File to Modify:** `packages/core-logic/src/hooks/data/useDatasource.ts`

    ```typescript
    // Before:
    // const token = useInternalSessionStore.getState().token;
    // ...
    // queryFn: async () => {
    //   if (!token) throw new Error(...);
    //   const response = await datasource.get(entity, params, token);
    // ...
    // enabled: !!entity && !!token,

    // After:
    import { useQuery } from '@tanstack/react-query';
    import { datasource } from '@workspace/api-client';
    import { useSession } from '../../hooks/useSession';

    export function useDatasource({ entity, params }) {
      const { isAuthenticated } = useSession(); // Check if user is logged in

      return useQuery({
        queryKey: ['datasource', entity, params],
        queryFn: async () => {
          // The api-client no longer needs a token.
          // The browser will send the session cookie automatically.
          const response = await datasource.get(entity, params);
          // ... error handling
          return response.data;
        },
        // The query is enabled if the user is authenticated.
        enabled: !!entity && isAuthenticated,
      });
    }
    ```

### **5. Testing Strategy**

1.  **Server-Side Testing:**

    * **Login Route:** Write a test that calls the `/api/auth/login` endpoint. Mock the ERP response. Assert that the response does **not** contain a token and that the `Set-Cookie` header is present and correctly formatted.
    * **Protected Routes/Actions:** Write tests for endpoints like `/api/datasource`. Mock `getIronSession` to simulate both an authenticated user (with a token) and an unauthenticated user. Assert that the ERP `fetch` call is made with the correct `Authorization` header in the authorized case, and that a `401 Unauthorized` error is returned otherwise.

2.  **Client-Side Testing:**

    * **Code Review:** Perform a static code review of the `@workspace/core-logic` and `MainUI` packages to ensure no references to `token` or `Authorization` headers remain.
    * **Component Tests:** Existing component tests should continue to pass without modification, proving the UI layer's decoupling.

3.  **End-to-End (E2E) Testing:**

    * Create a test that performs a full login, navigates to a page with a data grid, and verifies that the data is loaded. Inspect network traffic to confirm the absence of the Bearer token and the presence of the `httpOnly` session cookie.

### **6. Implementation Checklist**

- [ ] Install the `iron-session` dependency.
- [ ] Create the `lib/session.ts` file and configure `sessionOptions`.
- [ ] Add a secure `SECRET_COOKIE_PASSWORD` to the `.env.local` file.
- [ ] **Refactor the `/api/auth/login` route to use `getIronSession` and `session.save()`, removing the token from the client response.**
- [ ] **Refactor all API Routes and Server Actions to get the token from `getIronSession` instead of the `Authorization` header.**
- [ ] **Remove the `token` property from the Zustand `sessionStore` in `@workspace/core-logic`.**
- [ ] **Simplify all data-fetching hooks in `@workspace/core-logic` to remove token handling logic.**
- [ ] **Clean up the `api-client` to remove any logic related to manually attaching authentication headers.**
- [ ] Implement server-side unit tests for the login route and a protected endpoint.
- [ ] Perform an E2E test to validate the complete, secure authentication flow.