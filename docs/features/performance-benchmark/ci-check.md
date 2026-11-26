# Automatic "Performance" check of PRs

- **Ticket:** ETP-6295 (epic ETP-6116, committee item N3, 2026-11-12)
- **Repositories:** this one (`playwright-tests/perf/`) and `com.etendoerp.jenkins.pipelines`
  (`playwright-automation/Jenkinsfile`, branch `feature/ETP-6295`)

## Behavior

Every PR to the new UI that changes performance-sensitive code (`playwright-tests/perf/sensitive-paths.txt`) gets
a **Performance** commit status next to **Playwright Tests**, and the comparison report as a PR comment.

| Outcome | Status | PR comment |
|---|---|---|
| No regression beyond the noise of the machine | success, "No regressions against the base" | The report |
| A regression that held up after re-measuring | failure, "N regression(s) against the base, see the PR comment" | The report, with the regressions |
| The check could not measure (base build failed, server did not start, timeout…) | error, "Could not run: <reason>" | Why it could not run: neither a pass nor a regression |
| The PR changes no sensitive file, or the push is to develop/main | no status | none |

- The status is **not required to merge**: a failure is a warning for the reviewer.
- The comment is the same one on every push: it is updated, never repeated. It carries no credential.
- "busy machine, see the report" is added to the status when the report warns that the timings are less reliable
  (CPU busy before starting, a round much busier than the others, or the container CPU quota holding a round back).

## How it runs

The **Performance** stage is the last one of `Validate` in the Playwright pipeline, after **Run Playwright Tests**,
on the same pod and under the same `playwright_pool` lock:

1. The **Playwright Tests** status is posted as soon as the tests end, before measuring, so the author never waits
   for the check to see the test result.
2. `perf/sensitive-check.mjs` tells whether the PR changes a sensitive file against `origin/<base branch>` (exit code
   0 = yes, 10 = no, 2 = cannot tell). Only with 0 does the stage post a pending **Performance** status.
3. `pnpm perf:compare` runs in QUICK mode (Sales Invoice, 3 rounds per side, 3 more for a suspected regression) with
   `SKIP_BUILD=1`: the head is the build of **BUILD UI**; only the base is built, in a worktree of the workspace.
4. `RESULT_FILE` (`perf/ci.mjs`) gives the status and its description; `perf/pr-comment.mjs` comments the report.
   The report, the result and the JSON of every round are archived as build artifacts.

Nothing the stage does changes the build result or the **Playwright Tests** status: any failure inside it becomes a
**Performance** error, and the stage stays green on purpose (marking it unstable would also trigger the post
actions of failed tests). A newer push cancels the build as before, measuring included; an abort that is not a
newer push leaves "Could not run: the build was aborted".

The stage never writes the shared local-env database cache (it uses no `LOCALENV_*` variable), calls
`build-update-github.sh` unchanged with a new context, and leaves the pod template and the lock as they are.

## Decisions

| Decision | Why |
|---|---|
| A last stage of the existing pipeline, not a new pipeline | The environment (ERP, database, head build) is already there; a second environment would cost ~20 min more (ticket scope). |
| QUICK comparison only | The full one (4 windows) takes 20–40 min; QUICK adds ~9–14 min (below). |
| Decide "sensitive or not" before any status | A pending status the tool later skipped would stay pending forever. |
| The base is built inside the stage | In parallel with the ERP install it competes for the 8 GB of the pod; in parallel with the tests it steals the CPU of an already CPU-bound suite; earlier and in sequence it gains nothing and delays the test result. |
| Fallback to the tip of the base | The module is cloned with `--depth 1`; the stage fetches 200 commits of history, and when the merge-base is still missing the report says the tip was measured. |
| `error`, not `failure`, when it could not run | GitHub has no neutral commit status; the description and the comment say it is neither a pass nor a regression. |
| Container CPU quota per round (`cgroupThrottledMs`) | The host CPU counters of a Kubernetes node include other pods; throttling of the pod's own quota explains slow rounds the host figures cannot. The 2 s warning threshold is provisional, to calibrate with real builds. |

## Configuration

Jenkinsfile `environment` (pipelines repository):

| Variable | Default | Meaning |
|---|---|---|
| `PERF_CHECK_ENABLED` | `true` | `false` turns the stage off without reverting anything |
| `PERF_CONTEXT_BUILD` | `Performance` | Name of the commit status |
| `PERF_TIMEOUT_MINUTES` | `30` | Longest the stage may hold the lock; then "Could not run" |
| `PERF_FETCH_DEPTH` | `200` | History fetched to find the merge-base |

Tool variables used by the stage (see [the tool README](../../../playwright-tests/perf/README.md)): `BASE_REF`,
`QUICK`, `SKIP_BUILD`, `PERF_WORKTREES_DIR`, `RESULT_FILE`, `REPORT_FILE`.

## Cost

Measured on Jenkins builds 2227–2242 before the change: **Run Playwright Tests** takes 56 min (median, 47–78), so a
whole run takes ~75 min. 53 of the 69 PRs merged since 2026-09-26 changed a sensitive file, so the check runs on
~77% of the PRs. Expected cost per run (to confirm with the first builds): base install and build ~4–5 min, six
QUICK rounds ~4–5 min, and ~4 min more only when a regression is re-measured. While it measures, the next PR waits
for the lock that much longer. The same task speeds up the Playwright suite to make up for it: see
[Keeping the PR time](../../testing/playwright-e2e/README.md#keeping-the-pr-time).

## Main files

- `playwright-tests/perf/sensitive-check.mjs`: whether the PR needs the check.
- `playwright-tests/perf/compare-branches.mjs`: the comparison (`RESULT_FILE`, `REPORT_FILE`, base fallback).
- `playwright-tests/perf/ci.mjs`: the result and the status description.
- `playwright-tests/perf/base.mjs`: merge-base or tip of the base.
- `playwright-tests/perf/machine.mjs`: CPU noise and container throttling per round.
- `playwright-tests/perf/pr-comment.mjs`: the single PR comment.
- `com.etendoerp.jenkins.pipelines/playwright-automation/Jenkinsfile`: the **Performance** stage.

The comparison itself (rounds, statistics, thresholds) is described in
[2026-10-08-perf-compare-design.md](2026-10-08-perf-compare-design.md) and the tool README.
