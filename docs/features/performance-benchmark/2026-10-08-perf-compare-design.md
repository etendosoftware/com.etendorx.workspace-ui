# Performance regression workflow: `pnpm perf:compare`

- **Ticket:** ETP-5641 (branch `hotfix/ETP-5641`, PR #955)
- **Status:** Approved
- **Date:** 2026-10-08

## 1. Goal

Catch performance regressions before merge without loading the CI pipeline, on developer machines that
differ a lot from each other (some are slow). Absolute numbers are not comparable across machines, so a
branch is always measured **against its own base, on the same machine, in the same session**.

## 2. Workflow

1. **Pre-push warning (`.githooks/pre-push`).** On every push, the hook lists the files the branch changes
   against its base. If any matches `playwright-tests/perf/sensitive-paths.txt` (form, grid, toolbar,
   selection, contexts, metadata client, expression evaluation…), it prints which files and asks to run
   `pnpm perf:compare` before opening the PR. It never blocks the push, needs no backend and takes
   milliseconds. Installed by `pnpm install` through the root `prepare` script
   (`git config core.hooksPath .githooks`); no new dependency.
2. **`pnpm perf:compare` (`playwright-tests/perf/compare-branches.mjs`).** Run by the developer before the PR:
   - Base: `git merge-base HEAD <target>`, target `origin/main` for `hotfix/*` branches and
     `origin/develop` otherwise (`BASE_REF` overrides).
   - Builds the base in a git worktree (`~/.cache/workspace-ui-perf-compare/<sha>`, outside the repo so
     jest and Biome never see it; cached by commit) and the working tree,
     copying `packages/MainUI/.env`, and serves them with `next start` on two ports.
   - Runs `bench.mjs` once per side, alternating base and head, `ROUNDS` times (default 3), so machine
     drift affects both sides alike.
   - Writes a Markdown report (`perf/results/compare-<date>.md`) ready to paste in the PR.
3. **PR template (`.github/pull_request_template.md`)** with a Performance section for that report.

## 3. Reading the comparison (`perf/stats.mjs`)

Per flow step, over the rounds of each side:

- **Deterministic metrics** (`apiRequests`, `apiBytes`) do not depend on the machine. More requests than
  the base in any step is reported as a regression; bytes more than 5% above the base too.
- **Timing metrics** (`settledMs`, `blockingMs`) depend on the machine. A step is a regression only when
  the head median is more than 10% and at least 100 ms (time) or 50 ms (blocking CPU) above the base
  median, **and** a bootstrap 95% confidence interval of the difference of medians is entirely above
  zero, i.e. larger than the noise of that machine. A first run with 2 rounds flagged +61 ms on a 289 ms
  step, which is why the absolute floor exists.
- Totals are reported over the steps that succeeded on both sides.

The command always exits 0 (informational); `STRICT=1` exits 1 when a regression is found.

## 4. Options

`ROUNDS` (3), `WINDOWS` (bench default: four windows), `QUICK=1` (Sales Invoice only), `CPU_THROTTLE`
(1; a slow machine needs none), `BASE_REF`, `BASE_PORT`/`HEAD_PORT` (3201/3202), `SKIP_BUILD=1` (reuse the
existing builds). The local Etendo backend must be running, as for the benchmark itself.

## 5. Tests

`node --test playwright-tests/perf/__tests__/`: medians, bootstrap interval, regression rules, sensitive
path matching.
