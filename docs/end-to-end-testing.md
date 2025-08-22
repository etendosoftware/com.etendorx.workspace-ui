PRD: API Integration Testing for WorkspaceUI (no UI E2E)

Summary

Goal: define and standardize the API‑integration and logic‑only testing strategy for WorkspaceUI (Next.js), integrating with Etendo Classic through the proxies documented in docs/api. The approach covers critical backend flows through the Next.js API routes, resilience to ERP/proxy changes, and reliable execution in CI/CD.

Scope

- Next.js BFF API integration: `/api/erp` and `/api/datasource` routes including cookie policies, CSRF, JSON passthrough, form encoding, and caching.
- Non‑visual logic tests (unit/integration) for critical pieces: payload mapping, defaults/callouts handling, and error paths.
- CI/CD integration with reports and tolerance to intermittent ERP failures.

Out of Scope

- UI E2E testing (Playwright/Cypress) and visual regression.
- Full end‑to‑end load/performance (covered separately where applicable).

Technical Context

- Architecture: WorkspaceUI (Next.js App Router) consumes Etendo Classic via proxies; see docs/api/erp-proxy.md and docs/api/datasource-proxy.md.
- Sessions: see docs/datasource-proxy-session.md for behavior with `ERP_FORWARD_COOKIES` (stateful vs session‑less) and `?isc_dataFormat=json`.
- Grids: virtual scrolling (docs/features/05-virtual-scrolling-grids.md) influences server payloads and pagination.
- Processes: defaults/process handlers and modals (docs/features/02-server-actions-process-modal*.md and related) define defaults logic, readonly/display logic, and execution.

Quality Objectives

- Reliability: critical flows stay green (>99% runs) with no flaky steps.
- Traceability: failures include evidence (trace/video/network logs) for debugging.
- Isolation: idempotent, controlled test data (fixtures/mocks or dedicated datasets).
- Speed: E2E suite < 10 minutes in CI with parallelism enabled.

Test Strategy

Tooling

- API Integration (BFF): Jest + Supertest for `/api/erp` and `/api/datasource` (including `[...slug]`, `[entity]`).
- Unit tests: Jest for utilities, mappers, and process/defaults logic.

Test Data and Isolation

- Dedicated test user(s) with constrained role/organization.
- Minimal repeatable dataset: customers/products/currency for “Sales Order” and one read‑only entity for grids.
- Unique identifiers per run (e.g., document suffix timestamp) and/or rollback via dedicated API where available.

Integration Cases (Jest + Supertest)

- `/api/auth/login`: captures `JSESSIONID` and server‑side session store when enabled.
- `/api/datasource` (reads): builds form‑urlencoded POST; cache key includes JWT context (user/client/org/role/warehouse).
- `/api/datasource/:entity` (writes): json→form mapping, `X‑CSRF‑Token` when `csrfToken` is present; passthrough with `?isc_dataFormat=json`.
- Cookie policy: with `ERP_FORWARD_COOKIES=false` no `Cookie` header is forwarded to ERP.
- `/api/erp[/*]`: transparent forward of querystring and methods; caching only for GETs.

API Integration Cases (Jest + Supertest)

- `/api/auth/login`: captures `JSESSIONID` and server‑side session store when enabled.
- `/api/datasource` (reads): builds form‑urlencoded POST; cache key includes JWT context (user/client/org/role/warehouse).
- `/api/datasource/:entity` (writes): json→form mapping, `X‑CSRF‑Token` when `csrfToken` is present; passthrough with `?isc_dataFormat=json`.
- Cookie policy: with `ERP_FORWARD_COOKIES=false` no `Cookie` header is forwarded to ERP.
- `/api/erp[/*]`: transparent forward of querystring and methods; caching only for GETs.

Technical Design of Integration Tests

- Use Supertest against Next.js route handlers with mocked Next primitives.
- Mock `unstable_cache` to execute functions directly and assert cache key composition separately.
- Mock `@/lib/auth` to supply deterministic JWT-derived user context and bearer tokens.
- Verify form‑urlencoded body creation, headers (Authorization/CSRF/Cookie policy), and correct forward URLs.

Configuration and Environments

- Minimum env vars: `ETENDO_CLASSIC_URL`, test credentials (when applicable), `ERP_FORWARD_COOKIES` (true/false).
- Sensitive data: manage via dotenv/Jenkins credentials, never hardcoded.

CI/CD Integration (Jenkins)

- Run Jest unit/integration suites on PRs and main/develop.
- Publish JUnit/coverage reports where configured.

Acceptance Criteria

- [API] `/api/datasource` (read) builds form‑urlencoded and caches by context; 400/401 surfaced correctly.
- [API] `/api/datasource/:entity` (write) maps json→form and supports `?isc_dataFormat=json`.
- [Proxy] With `ERP_FORWARD_COOKIES=false` no cookies are forwarded to ERP (green integration test).
- [CI] Pipeline runs Jest suites on PR and publishes reports/coverage.

Implementation Plan (phases)

1) API Integration
- Jest + Supertest tests for `/api/erp` and `/api/datasource` covering cookies/json/form/caching.
2) CI
- Ensure Jest runs in Jenkins and publishes JUnit/coverage artifacts.

Risks and Mitigations

- Flakiness from virtual scrolling: synchronize with responses and use role/aria‑based assertions.
- ERP QA dependency: run stubbed on PRs and reserve live suite for nightly/merge.
- Residual data: cleanup via API or unique marks + filters.
- ERP API changes: versioned fixtures and minimal contract tests.

Deliverables

- Jest + Supertest suite for proxies.
- Documentation for local/CI execution and fixture maintenance.
