# Technical Debt: API Integration Testing (Feature: API-Integration-Testing)

This document lists known technical debt, shortcuts, justifications, impacts, and a plan to pay down the debt for the integration testing feature.

## Debt Items

1. Mock abstraction surface
- Description: The `_test-utils` provide mocks for `global.fetch`, `@/lib/auth`, and `next/cache`, but they are currently ad-hoc and spread across multiple files.
- Justification: Faster to implement tests by reusing existing helpers; avoid large refactor during initial rollout.
- Impact: Duplicate mocking patterns may accumulate; harder to reason about global test state in large suites.
- Mitigation/Paydown: Consolidate mocks into a single `test-mocks` module and add documentation/usage examples in Phase 3.
- Priority: Medium
- Planned paydown: Sprint+2 (create `test-mocks/index.ts`, migrate existing tests)

2. Cache key capture hack
- Description: To validate cache key composition we will wrap `unstable_cache` and capture generated key parts. This is an invasive test-only wrapper.
- Justification: There is no public API to inspect keys; capturing is needed for acceptance tests.
- Impact: If `unstable_cache` changes shape, tests break. Test code might hide real cache semantics.
- Mitigation: Encapsulate wrapper exclusively in `_test-utils` and document behavior; plan to replace with a more robust cache interface if Next.js cache API stabilizes.
- Priority: Medium
- Planned paydown: Sprint+3 (refactor application code to use a `cacheLayer` abstraction)

3. Partial reliance on direct handler invocation rather than full HTTP server
- Description: Tests bypass the HTTP layer, invoking handlers directly. This avoids Supertest and full network stack validation.
- Justification: Faster and deterministic tests; repository pattern leans to this approach.
- Impact: Potential mismatch between App Router runtime and direct invocation in edge cases (headers, streaming, middleware). Rare regressions might slip.
- Mitigation: Add a smaller set of Supertest-based smoke tests for critical routes (one or two) to cover the HTTP surface.
- Priority: Low
- Planned paydown: Sprint+4 (add 2-3 smoke tests with Supertest)

4. Fixture duplication
- Description: Test fixtures may be duplicated across test files for speed and isolation.
- Justification: Developers kept tests self-contained for readability.
- Impact: Higher maintenance cost when changing shared payload shapes.
- Mitigation: Add a shared fixtures folder and lint rule to avoid duplication.
- Priority: Low
- Planned paydown: Sprint+3

5. CI resource tuning (temporary)
- Description: Initial CI config may run tests on default resource quotas leading to slow performance.
- Justification: Prioritize correctness over performance during rollout.
- Impact: Longer pipeline runs, potential queueing delays.
- Mitigation: Tune `--maxWorkers` in Jest, cache node_modules, and select faster runners.
- Priority: Low
- Planned paydown: Sprint+2

---

## Overall risk assessment
- Current approach balances speed of delivery and test reliability. The main technical risk is the `unstable_cache` wrapper and the divergence between direct handler invocation and the actual App Router runtime. Both are addressed with clear mitigations and future work items.

## Recommended cleanup timeline
- Sprint+1: Consolidate test mocks (high value, medium effort)
- Sprint+2: Add CI tuning and begin migrating fixtures to a shared location
- Sprint+3: Implement `cacheLayer` abstraction and replace test-only wrappers
- Sprint+4: Add Supertest smoke tests for the HTTP surface

## Acceptance criteria for paying down debt
- All tests pass locally and in CI after migrating to consolidated mocks
- Cache key assertions rely on `cacheLayer` stable interface instead of internal wrappers
- Reduced fixture duplication by >80% across integration tests
- Added 2 Supertest smoke tests that validate the HTTP boundary

---

End of technical debt document.
