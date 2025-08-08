# API Route: Datasource Proxy

## Overview

The `/api/datasource` API Route acts as a server-side proxy between the WorkspaceUI client and the Etendo Classic ERP. This implementation provides caching, security, and performance improvements as specified in PRD-01.

## Endpoints

```
POST /api/datasource                # JSON body { entity, params }
ALL  /api/datasource/:entity        # Pass-through with JSON→form conversion for writes
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

## Authentication and User Context

- The client sends `Authorization: Bearer <token>` with every request.
- The server decodes the JWT to derive user context for cache isolation. Expected claim names: `user` (userId), `client` (clientId), `organization` (orgId), `role` (roleId). Optionally `warehouse` if applicable. No custom context headers are required.

## Caching Strategy

The implementation uses Next.js `unstable_cache` with the following characteristics:

- **Cache Key**: Generated from JWT-derived `userContext` (including `warehouse`), `entity`, and `params`
- **Isolation**: Each user/client/org/role combination has separate cache entries
- **Base Key**: `datasource_v2` for cache versioning

## ERP Communication

- Reads/fetch (grids):
  - URL: `${ETENDO_CLASSIC_URL}/org.openbravo.service.datasource/${entity}`
  - Method: POST
  - Content-Type: `application/x-www-form-urlencoded`
  - Headers: `Authorization: Bearer <userToken>`
- Writes (add/update) via `/api/datasource/:entity`:
  - Accepts client JSON (SmartClient) and converts to `application/x-www-form-urlencoded`
  - Maps fields: `dataSource`, `operationType`, `componentId`, `csrfToken`, `data`, `oldValues`
  - Adds `X-CSRF-Token` header if `csrfToken` is present

## Error Handling

- **401 Unauthorized**: Missing or invalid user context
- **400 Bad Request**: Missing required entity parameter
- **500 Internal Server Error**: ERP communication or processing failures

## Environment Variables

Required environment variables:

- `ETENDO_CLASSIC_URL`: Base URL of the Etendo Classic ERP

## Security Features

1. **Bearer token forwarding**: The server forwards the user's token to the ERP
2. **CSRF handling**: JSON writes are converted to form-urlencoded and include `csrfToken` + `X-CSRF-Token`
3. **User context validation**: Ensures users only access authorized data via JWT-derived context
3. **Request isolation**: Cache keys prevent cross-user data leakage
4. **Error sanitization**: Internal errors are not exposed to clients

## Performance Benefits

- **Reduced network calls**: Server-side caching eliminates redundant ERP requests
- **Improved response times**: Cached responses served directly from Next.js
- **Better scalability**: Centralized request handling and deduplication
