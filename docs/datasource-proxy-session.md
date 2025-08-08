# ERP Datasource Proxy: Stateful vs Session‑less

This document explains how the Next.js proxy forwards datasource requests to the ERP, how session cookies are handled, and how to run in stateful or session‑less mode.

## Overview

The UI talks to the ERP through Next.js API routes so we can unify auth, shape payloads and avoid CORS issues. Classic ERP endpoints (e.g. `org.openbravo.service.datasource/...`) are always reached through the forward servlet path:

```
{ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/{Entity}
```

Two proxy routes exist:

- `POST /api/datasource` → grid fetches (reads), form posts
- `/{method} /api/datasource/:entity` → save/update/delete per entity

By default, the proxy is stateful: it forwards the ERP session cookie (JSESSIONID) captured at login. You can turn this off to run session‑less at any time. Payload format (JSON vs form) is controlled per request via a URL parameter (see Passthrough Control).

## Modes

1) Stateful (default)
- Forwards a valid ERP session cookie (JSESSIONID) with each call.
- Matches prior direct‑to‑ERP behavior and avoids CSRF issues when the ERP validates tokens against the session.

2) Session‑less
- Does not forward ERP cookies. Requests are authenticated only via `Authorization: Bearer <token>`.
- May require ERP‑side CSRF configuration that does not depend on JSESSIONID, or a different auth flow.

Switching modes is controlled by a single env var (see Configuration).

## How it works (stateful)

1) Login proxy captures the ERP session cookie
- File: `packages/MainUI/app/api/auth/login/route.ts`
- After proxying `POST {ETENDO_CLASSIC_URL}/meta/login`, it looks at the `Set-Cookie` header and extracts `JSESSIONID`.
- The cookie is stored server‑side, keyed by the returned Bearer token.

2) Cookie store (in‑memory)
- File: `packages/MainUI/app/api/_utils/sessionStore.ts`
- Exposes `setErpSessionCookie(token, cookie)`, `getErpSessionCookie(token)`.
- Note: in-memory is fine for local dev; see Deployment for production guidance.

3) Datasource proxy forwards combined cookies
- Files:
  - `packages/MainUI/app/api/datasource/route.ts`
  - `packages/MainUI/app/api/datasource/[entity]/route.ts`
- Both use `getCombinedErpCookieHeader(request, userToken)` to compute the `Cookie` forwarded to ERP.
  - It combines any incoming browser cookies (if relevant) with the stored ERP JSESSIONID.
  - When disabled (session‑less), it returns an empty string so no cookies are sent.

4) JSON passthrough vs form conversion (save/update)
- Files: `packages/MainUI/app/api/datasource/route.ts`, `packages/MainUI/app/api/datasource/[entity]/route.ts`
- If the URL has `?isc_dataFormat=json`, the proxy forwards JSON unchanged with `Content-Type: application/json`.
- Otherwise, JSON payloads are converted to `application/x-www-form-urlencoded` and forwarded as form data.
- Workaround: when forwarding form data for saves, the proxy intentionally omits the `Content-Type` header to avoid a backend bug while still sending the body.
- If the client sends `X-CSRF-Token`, it’s passed through when applicable.

## Configuration

Env var: `ERP_FORWARD_COOKIES`

- Description: Controls whether ERP cookies (e.g. JSESSIONID) are forwarded.
- Default: true (stateful).
- Values considered “false”: `false`, `FALSE`, `0`.

Examples:

```
# Stateful (default)
ERP_FORWARD_COOKIES=true

# Session‑less
ERP_FORWARD_COOKIES=false
```

Helper:

- File: `packages/MainUI/app/api/_utils/forwardConfig.ts`
- `shouldForwardErpCookies()` reads the env and decides.
- `getCombinedErpCookieHeader(request, userToken)` centralizes how the cookie header is built (or not).
- `shouldPassthroughJson(request)` returns true iff the request URL has `isc_dataFormat=json`.

Passthrough Control (JSON vs form)

- To forward JSON unchanged: add `?isc_dataFormat=json` to the request URL.
- To use form encoding: omit the parameter and the proxy will convert JSON to form.
- Rationale: forms decide the payload format explicitly per request without global env flags.

## Deployment notes

- The session store is in‑memory. For production, use a shared store (Redis/KV/DB) so cookies survive restarts and multiple instances:
  - Replace `sessionStore.ts` Map with a Redis client.
  - Key by token (or user) and set an expiration.

- Security: JSESSIONID remains server‑side and is never exposed to the browser. The proxy only forwards it outbound to ERP.

## Troubleshooting

- CSRF errors (stateful):
  - Confirm that login succeeded via the proxy and that a `Set-Cookie: JSESSIONID=...` was returned by ERP.
  - Ensure the proxy stored the cookie (check logs or instrument `setErpSessionCookie`).
  - Ensure requests go through `/api/datasource` or `/api/datasource/:entity` and not directly to ERP.

- CSRF errors (session‑less):
  - ERP may require JSESSIONID for CSRF validation. Switch to stateful (`ERP_FORWARD_COOKIES=true`) or update ERP config.

## Tests

- Session‑less behavior is covered by:
  - `packages/MainUI/app/api/datasource/__tests__/no-cookie-forward.integration.test.ts`
  - `packages/MainUI/app/api/datasource/[entity]/__tests__/no-cookie-forward.integration.test.ts`

These assert that no `Cookie` header is forwarded when `ERP_FORWARD_COOKIES=false`.

- JSON passthrough is covered by:
  - `packages/MainUI/app/api/datasource/[entity]/__tests__/json-passthrough.integration.test.ts` (uses `?isc_dataFormat=json`)

## File map (quick reference)

- Cookie policy / config: `app/api/_utils/forwardConfig.ts`
- Session store (in‑memory): `app/api/_utils/sessionStore.ts`
- Login proxy (captures JSESSIONID): `app/api/auth/login/route.ts`
- Datasource read proxy: `app/api/datasource/route.ts`
- Datasource save/update proxy: `app/api/datasource/[entity]/route.ts`
