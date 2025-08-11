# API Route: Datasource Proxy

## Overview

The `/api/datasource` API Route acts as a server-side proxy between the WorkspaceUI client and the Etendo Classic ERP. This implementation provides caching, security, and performance improvements as specified in PRD-01.

## Endpoint

```
POST /api/datasource
```

## Request Format

```json
{
  "entity": "string",
  "params": {
    "_noCount": "true",
    "_operationType": "fetch",
    "isImplicitFilterApplied": "false",
    "windowId": "string",
    "tabId": "string",
    // ... other datasource parameters
  }
}
```

## User Context Handling

The API Route extracts user context from the request to ensure proper data isolation and security:

1. **Primary Method**: Custom headers
   - `X-User-ID`: User identifier
   - `X-Client-ID`: Client identifier  
   - `X-Org-ID`: Organization identifier
   - `X-Role-ID`: Role identifier

2. **Fallback Method**: Cookies
   - `userId`: User identifier cookie
   - `clientId`: Client identifier cookie
   - `orgId`: Organization identifier cookie
   - `roleId`: Role identifier cookie

## Caching Strategy

The implementation uses Next.js `unstable_cache` with the following characteristics:

- **Cache Key**: Generated from `userContext`, `entity`, and `params`
- **Isolation**: Each user/client/org/role combination has separate cache entries
- **Base Key**: `datasource_v2` for cache versioning

## ERP Communication

The proxy forwards requests to Etendo Classic with:

- **URL**: `${ETENDO_CLASSIC_URL}/org.openbravo.service.datasource/${entity}`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **Headers**: 
  - `Authorization: Bearer ${ETENDO_SERVER_TOKEN}`
  - User context headers for business rule application

## Error Handling

- **401 Unauthorized**: Missing or invalid user context
- **400 Bad Request**: Missing required entity parameter
- **500 Internal Server Error**: ERP communication or processing failures

## Environment Variables

Required environment variables:

- `ETENDO_CLASSIC_URL`: Base URL of the Etendo Classic ERP
- `ETENDO_SERVER_TOKEN`: Server-to-server authentication token

## Security Features

1. **Server-side authentication**: All ERP communication uses server-stored credentials
2. **User context validation**: Ensures users only access authorized data
3. **Request isolation**: Cache keys prevent cross-user data leakage
4. **Error sanitization**: Internal errors are not exposed to clients

## Performance Benefits

- **Reduced network calls**: Server-side caching eliminates redundant ERP requests
- **Improved response times**: Cached responses served directly from Next.js
- **Better scalability**: Centralized request handling and deduplication
