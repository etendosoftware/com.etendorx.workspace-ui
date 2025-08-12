# PRD-01: Implementation of API Routes as a Server-Side Proxy

**Status:** Proposed  
**Owner:** Development Team  
**Date:** 2024-07-25  
**Priority:** CRITICAL

## 1\. Problem

The current architecture of Etendo WorkspaceUI relies exclusively on direct communication from the client (browser) to the Etendo Classic ERP. This creates the following critical issues:

- **Poor Performance:** Every data request (datasources, metadata, etc.) is an independent network call from the client, without any form of centralized caching or deduplication.
- **Weak Security:** Credentials and authentication logic are managed on the client side, which increases the attack surface.
- **Limited Scalability:** It fails to leverage the capabilities of the Next.js server for optimizing data fetching and delivery, such as caching, streaming, or executing business logic on the server.
- **Logic Duplication:** The logic for fetching and processing data is scattered across multiple components and hooks on the client side.

## 2\. Proposed Solution

The proposal is to create a set of **API Routes** in Next.js that will act as a **smart proxy** between the WorkspaceUI client and the Etendo Classic ERP.

This proxy layer will be responsible for:

1.  **Centralizing Requests:** All `fetch` calls from the client will be directed to internal API Routes (`/api/...`).
2.  **Managing Authentication:** Communication with the ERP will be handled securely from the server, using tokens or credentials stored as environment variables.
3.  **Implementing Server-Side Caching:** Utilizing Next.js caching primitives (`unstable_cache`, `fetch` cache) to drastically reduce redundant calls to the ERP.
4.  **Abstracting Data Logic:** Providing clean and specific endpoints for the client's needs (e.g., `/api/datasource`, `/api/process`).

## 3\. Technical Implementation

### 3.1. User Context and Security Handling (CRITICAL)

To ensure data integrity and security, the cache must be unique to the user's full session context. The server derives the context by decoding the user's JWT (Bearer token) sent by the client. No custom context headers are used. Cache keys incorporate JWT-derived claims such as `user` (userId), `client` (clientId), `organization` (orgId), `role` (roleId), and `warehouse` (warehouseId) to guarantee isolation.

### 3.2. Creation of the Datasource API Route

A new file will be created at `app/api/datasource/route.ts` with an implementation that respects the user context.

```typescript
// app/api/datasource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getUserContext, extractBearerToken } from '@/lib/auth';

// Cached function that uses the user's Bearer token and request params
const getCachedData = unstable_cache(
  async (userToken: string, entity: string, params: any) => {
    const response = await fetch(`${process.env.ETENDO_CLASSIC_URL}/org.openbravo.service.datasource/${entity}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params as Record<string, string>),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch data from Etendo Classic');
    }
    return response.json();
  },
  ['datasource_v2']
);

export async function POST(request: NextRequest) {
  try {
    const userToken = extractBearerToken(request);
    const userContext = await getUserContext(request); // derived from JWT
    if (!userToken || !userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, params } = await request.json();
    if (!entity) {
      return NextResponse.json({ error: 'Entity is required' }, { status: 400 });
    }

    const data = await getCachedData(userToken, entity, params);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

### 3.3. Modification of the API Client

The API client (`packages/api-client/src/api/client.ts`) will be modified to point to our new API Route. It does not need to be aware of the user context, as the server will handle it.

**Before:**

```typescript
const response = await fetch(destination, { ... }); // destination is the ERP URL
```

**After:**

```typescript
// The `entity` and `params` are sent in the body
const response = await fetch('/api/datasource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ entity, params })
});
```

For writes (add/update), the app may call `/api/datasource/:entity` with a SmartClient JSON payload. The proxy converts it to `application/x-www-form-urlencoded` and forwards it with `X-CSRF-Token` when `csrfToken` is provided.

## 4\. Success Metrics

- **Reduction in Initial Load Time (LCP):** A decrease of at least 40% in windows that depend on multiple datasources.
- **Reduction in Network Calls to the ERP:** A decrease of at least 70% in the number of requests to the Etendo Classic backend, measured via server logs.
- **Improvement in Performance Score (Lighthouse):** An increase of at least 20 points in the "Performance" category.

## 5\. Acceptance Criteria

- [x] The `app/api/datasource/route.ts` API Route has been created.
- [x] The API Route extracts and validates the user context (`user`, `client`, `organization`, `role`, `warehouse`) from the JWT.
- [x] The cache key generated by `unstable_cache` is unique per user context derived from the JWT (`user`, `client`, `organization`, `role`, `warehouse`).
- [x] Communication between the API Route and the Etendo Classic ERP forwards the user's Bearer token securely; no custom context headers are required.
- [x] The frontend `ApiClient` has been refactored to point to `/api/datasource`.
- [ ] The application's windows and grids load data correctly through the new proxy.
- [ ] The application correctly handles error states if the API Route fails.
- [x] Documentation for the new API Route has been added to `docs/api`, explaining the handling of user context.

## 6\. Implementation Status

### ✅ Completed Components

1. **API Route `/api/datasource`** - `packages/MainUI/app/api/datasource/route.ts`
   - Implements caching with user context isolation (derived from JWT)
   - Forwards the user's Bearer token to the ERP
   - Proper error handling and request forwarding

2. **API Route `/api/auth/login`** - `packages/MainUI/app/api/auth/login/route.ts`
   - Unauthenticated proxy for login requests
   - Direct forwarding to ERP `/meta/login` endpoint

3. **Generic ERP Proxy `/api/erp/[...slug]`** - `packages/MainUI/app/api/erp/[...slug]/route.ts`
   - Handles metadata, location, and other business logic endpoints
   - Intelligent caching (bypasses cache for mutations)
   - Supports dynamic routing for all ERP endpoints
   - Always appends query parameters (GET/POST/PUT/DELETE)

4. **Authentication Module** - `packages/MainUI/lib/auth.ts`
   - User context extraction by decoding JWT (Bearer token)
   - Token utilities (extraction/decoding)
   - Cache key generation with user isolation

5. **API Client Updates** - `packages/api-client/src/api/datasource.ts`
   - Refactored to use Next.js proxy endpoints
   - Maintains backward compatibility

6. **API Documentation** - `docs/api/datasource-proxy.md`
   - Complete API specification
   - Usage examples and security details

### 🔄 Environment Configuration Required

Add to `.env.local`:
```env
ETENDO_CLASSIC_URL=https://your-etendo-erp.com/openbravo
```
7. **ERP Base Proxy `/api/erp`** - `packages/MainUI/app/api/erp/route.ts`
   - Forwards to `${ETENDO_CLASSIC_URL}` + query
   - Special-case: forwards FormInitializationComponent to kernel forward
