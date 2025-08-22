# PRD: Nightly Suite - Integration Tests Against Real Etendo Classic

Status: Draft (Phase 1 — Co-creation)

Purpose

This document defines the product requirements for a suite of integration tests that RUN against a real Etendo Classic server (no mocks), executed in a separate nightly pipeline. The goal is to validate end-to-end contracts between WorkspaceUI (BFF) and Classic under real conditions, detect integration regressions, and verify critical flows (datasource reads/writes, ERP forwards, cookie/CSRF policies).

Scope of this section (Summary and Objectives)

- Executive summary of the feature and its rationale.
- Measurable objectives of the nightly suite.
- Success criteria and main constraints.

Objectives (SMART)

1. Detect integration regressions between the BFF and Classic on critical flows: `/api/datasource` (read/write) and `/api/erp/*`.
2. Produce JUnit reports and artifacts (HTTP logs/responses) for each nightly run, with minimal traceability to reproduce failures.
3. Maintain a suite that, when run in a clean real environment, has a flake rate < 5% and uses retry/timeout rules compatible with the CI.
4. Ensure the nightly suite is independent from PR suites (fast and hermetic) and runs in a separate nightly pipeline.

Stakeholders

- Frontend Team (owner of the BFF / tests)
- Infra / QA Team (provides Classic environment and test credentials)
- Product owners who require stability in critical processes

Main Constraints

- This PRD assumes the Classic environment is already available and reset to a clean state for each run (provisioning and snapshots are out of scope for this document).
- Nightly tests are intentionally slower and must not block PR checks.

---

Feedback requested for this section

Is the purpose and the objectives clear? Should we add any additional measurable objective (for example, a maximum tolerated duration for the nightly suite) or any organizational constraint (time window for execution)?

If you confirm, I will continue with the next section: Detailed scope, Use Cases and Test Matrix (each case: inputs/outputs/acceptance criteria).
