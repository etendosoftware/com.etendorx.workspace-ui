# Performance benchmark

Runs fixed user flows in a real Chromium and records time, request count, bytes and server wait,
so the same flows can be re-measured after each optimization and compared.

```bash
cd playwright-tests
BASE_URL=https://demo.etendo.cloud LABEL=demo-baseline RUNS=3 node perf/bench.mjs
BASE_URL=http://localhost:3000     LABEL=local-baseline RUNS=3 node perf/bench.mjs
node perf/compare.mjs perf/results/demo-baseline-*.json perf/results/demo-after-gzip-*.json
```

Slow-machine runs: `CPU_THROTTLE=4` (Chrome CPU slowdown; 4x ≈ mid/low-end laptop, 6x ≈ low-end).
`PROFILE=1` also saves one `.cpuprofile` per step under `perf/results/profiles/<LABEL>/` (open in
Chrome DevTools > Performance, or aggregate with `node perf/hotspots.mjs <dir> <sourcemap-dir>`).
Profiling adds overhead: keep timing runs and profile runs separate.

Env: `BASE_URL`, `LABEL`, `RUNS` (default 3, median is reported), `WINDOWS` (comma list,
default `Sales Order,Sales Invoice,Goods Shipment,Purchase Order`), `ETENDO_USER`/`ETENDO_PASS`
(default admin/admin), `HEADED=1` to watch it.

## Flows (per window, each in a fresh browser context = empty cache)

| Step | What it does | Ready when |
|---|---|---|
| `login` | Load `/`, log in | Dashboard "Add widget" visible |
| `open-cold` | Open the window from the menu search | Grid shows "Showing N records" |
| `reload-warm` | Browser reload of the same window URL (localStorage/HTTP cache populated) | Grid visible |
| `load-unfiltered` | Toggle the implicit filter off (full first page of 100 rows) | Grid shows "Showing N records", N > 0 |
| `arrow-nav-5` | Select the second row, then 5 ArrowDown 100 ms apart | 7th row selected |
| `open-record` | Double click first grid row | URL has the record id |
| `form-next-5` | 5 clicks on the form's Next button, each as soon as it is enabled | position indicator advanced by 5 |
| `type-10-chars` | Type "perf-check" into the Description textarea (never saved) | keystrokes done (CPU tail counted in `interactiveMs`) |

## Metrics

- `visibleMs`: action → ready condition (what the user waits for).
- `settledMs`: action → no API request in flight for 1s (includes background requests).
- `interactiveMs`: action → network quiet AND no long task for 1s (UI actually usable again).
- `blockingMs`: sum of (long task − 50ms) inside the step, like Lighthouse TBT — time the UI ignores input.
- `longTaskMs` / `maxLongTaskMs`: total and worst single main-thread task (a 5s task = 5s frozen screen).
- `apiRequests`: calls to `/api/*`, `/sws/*`, `/etendo/*` and RSC navigations — server load proxy.
- `apiBytes` / `bytes`: bytes on the wire (compressed size, headers included), API only / everything.
- `apiWaitMs`: sum over API requests of send→first byte (server processing + 1 RTT each) —
  the server-time spent on the flow; drops when calls get fewer or cheaper.
- `byEndpoint`: per-endpoint count/bytes/wait for the median run, to see *which* call improved.

Results are written to `perf/results/<LABEL>-<date>.json`. Compare runs taken from the same
machine and network; demo numbers include network RTT (~260ms on the 2026-10-01 baseline machine).
The committed React baselines (local-react-cpu1x/cpu4x) lack `type-10-chars` for Sales Order and
Purchase Order (the typing step failed on those windows when they were recorded); `compare.mjs`
totals only flows that succeeded in both files.

## Troubleshooting

- `Cannot find module '.../restore-node-options.cjs'`: the shell injects a `NODE_OPTIONS` preload that no
  longer exists. Run the scripts as `env -u NODE_OPTIONS node perf/bench.mjs`.
- Port 3000 taken by another dev server: start the production build on another port
  (`npx next start -p 3100` from `packages/MainUI`) and pass `BASE_URL=http://localhost:3100`.
- Classic runs need `FLAVOR=classic` and `BASE_URL=http://localhost:8080/etendo`.

## Comparing a branch with its base (`pnpm perf:compare`)

Machines differ too much to compare absolute numbers, so a branch is measured against its own base on the
same machine, in the same session. Run it before opening a PR when the pre-push hook warns that the branch
touches performance-sensitive code (`perf/sensitive-paths.txt`), and paste the report in the PR.

```bash
# Local Etendo backend running (the one packages/MainUI/.env points to)
pnpm perf:compare              # 4 windows, 3 rounds per side (~20-40 min)
QUICK=1 pnpm perf:compare      # Sales Invoice only (~5-10 min)
```

What it does: finds the base (`git merge-base HEAD origin/develop`, or `origin/main` for `hotfix/*`;
`BASE_REF` overrides), builds it in a cached worktree under `~/.cache/workspace-ui-perf-compare/`, builds the
working tree, serves both (ports 3201/3202), runs `bench.mjs` alternating base and head, and writes
`perf/results/compare-<date>.md`.

How to read it: more requests than the base, or API bytes more than 5% higher, is a regression. Time and
blocking CPU are regressions only when more than 10% higher, at least 100 ms (time) or 50 ms (blocking CPU)
more, **and** the bootstrap 95% interval of the difference is above zero, i.e. larger than the noise
measured on that machine. Use at least 3 rounds: with fewer, the noise estimate is weak. The command never fails
unless `STRICT=1`.

Options: `ROUNDS`, `WINDOWS`, `QUICK=1`, `CPU_THROTTLE` (default 1), `BASE_REF`, `BASE_PORT`/`HEAD_PORT`,
`SKIP_BUILD=1` (reuse existing builds), `PERF_WORKTREES_DIR`. Remove old base worktrees with
`git worktree prune` after deleting the folders.

The pre-push hook (`.githooks/pre-push`, enabled by `pnpm install`) only prints the warning; it never blocks
a push. Unit tests of the comparison: `pnpm test:perf`.

