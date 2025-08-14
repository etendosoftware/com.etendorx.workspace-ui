# **Technical Design Document: 01 - Unified Server-Side API Proxy**

**Version:** 2.0 (Revised to include Authentication and Business Logic endpoints)
**Author:** Gemini
**Associated PRD:** `PRD-01: Implementation of API Routes as a Server-Side Proxy`

### **1. Summary and Objective**

This document details the technical steps to refactor **all client-side communication with the ERP** into a server-side model using Next.js API Routes.

The goal is to create a secure and centralized proxy that intercepts all outgoing calls, including **data (`datasource`), metadata, authentication (`login`), and specialized business logic (`location`)**. All requests will be routed through the Next.js server, which will apply a caching layer where appropriate and manage secure communication with the Etendo ERP. The server will propagate the user's Bearer Token for authenticated requests, allowing the Etendo backend to handle the user's context.

### **2. Analysis of Gaps in Previous Version**

The initial design correctly covered `datasource` and `metadata` calls but did not explicitly account for other critical communication patterns found in the codebase. This revised version addresses the following identified gaps:

1.  **Authentication Endpoint (`/meta/login`):** The login process is a unique, unauthenticated `POST` request that establishes the user session. It requires its own dedicated proxy route outside the standard authenticated data flow.
2.  **Specialized Business Endpoints (`/location/create`):** The application uses specific endpoints for business logic that do not fit the `datasource` or `metadata` patterns. A generic, scalable proxy is needed to handle these and future custom endpoints.

### **3. Proposed Architecture (Unified Proxy)**

We will create a set of API Routes to act as the single entry point for all communication with the ERP. This creates a clean "backend-for-frontend" (BFF) pattern.

1.  `app/api/auth/login/route.ts`: A dedicated, unauthenticated route to proxy login credentials.
2.  `app/api/datasource/route.ts`: A specialized route for all `datasource` requests, applying per-user caching.
3.  `app/api/erp/[...slug]/route.ts`: A generic, authenticated, and dynamic route to proxy all other requests to the ERP, including `metadata`, `location`, and any other business logic endpoint.

**Proposed Flow Diagram:**

```
[Client Application]
|
+-> fetch to `POST /api/auth/login` (for login)
+-> fetch to `POST /api/datasource` (for data)
+-> fetch to `POST /api/erp/meta/...` (for metadata)
+-> fetch to `POST /api/erp/location/...` (for location services)
|
-> [API Routes on Next.js Server]
|  1. (For /auth/login) Forwards credentials without a token.
|  2. (For others) Extracts User's Bearer Token.
|  3. Uses `unstable_cache` with a key including the token.
|  4. Makes the secure Server-to-ERP `fetch` call.
|
-> [Etendo ERP] (Validates credentials/token, returns data)
```

### **4. Detailed Implementation**

#### **Step 4.1: Environment Variable Configuration**

Only the base ERP URL is required.

```sh
# .env.local
ETENDO_CLASSIC_URL=https://your-etendo-erp.com/openbravo
```

#### **Step 4.2: Create the API Route for Authentication**

This route is special as it does not handle a user token but proxies the login request.

**File to Create:** `app/api/auth/login/route.ts`

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const erpLoginUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/login`;

    // Proxy the login request to the ERP
    const erpResponse = await fetch(erpLoginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await erpResponse.json();

    if (!erpResponse.ok) {
      return NextResponse.json({ error: data.error || 'Login failed' }, { status: erpResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Route /api/auth/login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

#### **Step 4.3: Create the API Route for Datasource**

This route will handle data requests and apply caching.

**File to Create:** `app/api/datasource/route.ts`

```typescript
// app/api/datasource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

// The cached function takes the user token as part of its key.
const getCachedDatasource = unstable_cache(
  async (userAuthToken: string, entity: string, params: any) => {
    const erpUrl = `${process.env.ETENDO_CLASSIC_URL}/org.openbravo.service.datasource/${entity}`;
    
    const response = await fetch(erpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`ERP Datasource request failed: ${response.statusText}`);
    }
    return response.json();
  },
  ['datasource_v5'] // Base key for this cached function
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userAuthToken = authHeader.split(' ')[1];

    const { entity, params } = await request.json();
    if (!entity) {
      return NextResponse.json({ error: 'Entity is required' }, { status: 400 });
    }

    const data = await getCachedDatasource(userAuthToken, entity, params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route /api/datasource Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

#### **Step 4.4: Create the Generic API Route for all other ERP Logic**

This dynamic route will handle `metadata`, `location`, and other calls.

**File to Create:** `app/api/erp/[...slug]/route.ts`

```typescript
// app/api/erp/[...slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

// Cached function for generic ERP requests
const getCachedErpData = unstable_cache(
  async (userAuthToken: string, slug: string, body: string, contentType: string) => {
    const erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
    
    const response = await fetch(erpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userAuthToken}`,
        'Content-Type': contentType,
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`ERP request failed for slug ${slug}: ${response.statusText}`);
    }
    return response.json();
  },
  ['erp_logic_v1'] // Base key for this function
);

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userAuthToken = authHeader.split(' ')[1];

    const slug = params.slug.join('/');
    const requestBody = await request.text();
    const contentType = request.headers.get('Content-Type') || 'application/json';

    const data = await getCachedErpData(userAuthToken, slug, requestBody, contentType);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`API Route /api/erp/${params.slug.join('/')} Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch ERP data' }, { status: 500 });
  }
}
```

#### **Step 4.5: Modifying the `api-client`**

The `api-client` must be updated to point to these new, unified routes.

**File to Modify:** `packages/api-client/src/api/authentication.ts`

```typescript
// Before:
// const result = await Metadata.loginClient.request('/meta/login', { ... });

// After:
// It now points to our internal proxy, not the ERP.
const result = await Metadata.loginClient.request('/api/auth/login', { ... });
```

**File to Modify:** `packages/api-client/src/api/datasource.ts`

```typescript
// Before:
// return this.client.post(entity, this.buildParams(options));

// After:
// The client's base URL points to the ERP, so we call our internal proxy.
return this.client.post(`/api/datasource`, {
  entity: entity,
  params: options
});
```

**File to Modify:** `packages/api-client/src/api/metadata.ts` & `location.ts`

```typescript
// Any client making calls to endpoints like /meta/window/123 or /location/create
// will be updated to use the generic /api/erp/... proxy.

// In client.ts or similar, the final URL construction will be updated.
// The Base URL will be set to our Next.js app (e.g., http://localhost:3000)

// Example for a metadata call:
// Before: Metadata.client.post(`meta/window/${windowId}`);
// After: Metadata.client.post(`api/erp/meta/window/${windowId}`);

// Example for a location call:
// Before: locationClient.post(`location/create`, locationData);
// After: locationClient.post(`api/erp/location/create`, locationData);
```

### **5. Testing and Validation Strategy**

1.  **Authentication Flow:** Test the complete login process. Verify that a `POST` to `/api/auth/login` successfully proxies the request and returns a token.
2.  **Functional Tests:**
    * Verify that data grids (`datasource`) load correctly via `/api/datasource`.
    * Verify that window metadata loads correctly via `/api/erp/meta/...`.
    * Verify that creating a location works correctly via `/api/erp/location/create`.
3.  **Network Validation:** Open browser DevTools and confirm that **all** outgoing requests point to `/api/...` routes and **no** requests point directly to the `ETENDO_CLASSIC_URL`.
4.  **Security & Cache Tests:** Log in with `User A`, browse data. Log out and log in with `User B`. Confirm that `User B` does not see cached data belonging to `User A`.

### **6. Implementation Checklist**

- [x] Update `.env.local` to contain `ETENDO_CLASSIC_URL`.
- [x] Create the `app/api/auth/login/route.ts` API Route.
- [x] Create the `app/api/datasource/route.ts` API Route.
- [x] Create the generic dynamic `app/api/erp/[...slug]/route.ts` API Route.
- [x] Create comprehensive auth utilities in `lib/auth.ts`.
- [x] Refactor `api-client` to direct datasource calls to `/api/datasource`.
- [ ] Refactor `api-client` to direct authentication calls to `/api/auth/login`.
- [ ] Refactor `api-client` to direct all other ERP calls (metadata, location, etc.) to `/api/erp/...`.
- [ ] Execute all functional, network, and security tests.

### **7. Implementation Details**

#### **Actual Implementation vs Design**

The implementation includes the following characteristics:

1. **Bearer Forwarding**: Forwards the user's Bearer JWT to the ERP (no server-stored API key).
2. **User Context Isolation**: Derives context from JWT claims for cache isolation. Claim names used: `user` (userId), `client` (clientId), `organization` (orgId), `role` (roleId), and `warehouse` (warehouseId).
3. **Smart Caching**: Generic ERP route bypasses cache for mutations but caches read operations.
4. **Error Handling**: Comprehensive error handling with proper HTTP status codes.
5. **Auth Utilities**: Extracts token and decodes JWT; no custom user-context headers required.

#### **File Structure Created**
```
packages/MainUI/
├── app/api/
│   ├── auth/login/route.ts          # Authentication proxy
│   ├── datasource/route.ts          # Datasource with caching
│   └── erp/[...slug]/route.ts      # Generic ERP proxy
├── lib/
│   └── auth.ts                      # Auth utilities
└── ...

packages/api-client/src/api/
├── datasource.ts                    # Updated to use proxy
└── ...

docs/
├── api/datasource-proxy.md         # API documentation
└── features/                       # This document
```
