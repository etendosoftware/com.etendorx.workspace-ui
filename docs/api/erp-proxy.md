# ERP Proxy API Routes

## Overview

The ERP proxy centralizes all calls to Etendo Classic/OB endpoints via Next.js API routes. It forwards the user's Bearer JWT, appends query strings as-is, and applies smart caching on safe reads.

## Endpoints

- POST/GET `/api/erp`
  - Base forward to `${ETENDO_CLASSIC_URL}` with the same query string.
  - Special handling: if `_action=org.openbravo.client.application.window.FormInitializationComponent`, forwards to `${ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.client.kernel`.
  - Body is forwarded as-is; use JSON for initialization calls.

- ALL `/api/erp/[...slug]`
  - Forwards to `${ETENDO_CLASSIC_URL}/${slug}`.
  - Always appends the original query string (GET/POST/PUT/DELETE).
  - Caching: GET requests may be cached, mutations are not.

## Auth & Context

- Authorization: `Bearer <token>` required.
- JWT-derived user context is used for cache isolation (user, client, organization, role, warehouse).

## Content-Type

- For routes like `meta/window/*`, JSON bodies are supported.
- For legacy servlets that expect form-urlencoded (e.g., datasource save via forward), prefer using the dedicated datasource routes below.

