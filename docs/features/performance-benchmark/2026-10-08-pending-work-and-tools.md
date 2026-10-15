# UI performance: pending work and analysis tools (handoff)

- **Ticket:** ETP-5641 — first round merged in PR #955 (`main` @ `ee0e210db`, 2026-10-08)
- **Branch:** `hotfix/ETP-5641` (round 2 committed on it, not pushed — see §0)
- **Purpose:** starting point for a fresh analysis session. Everything below is measured or located in code;
  numbers are medians at `CPU_THROTTLE=4` (Chrome CPU slowed 4x, a mid/low-end machine) unless noted.

## 0. Start here — round 3 status (2026-10-14)

Round 2 was merged (UI #967, module #215). Round 3 is committed on `hotfix/ETP-5641` in both repos, **not pushed**:

| Repo | Commits |
|---|---|
| `com.etendorx.workspace-ui` | `66a228c86` menu revalidation · `f4eb90882` form re-renders on Next · `2ed686be8` render counter tool · `692449025` evaluation contexts shared between equal snapshots · `8f9b06042` grid repaints per keyboard step · `77007caa9` render counter `ACTION=arrow` · `4190928cf` FIC after fast navigation · `b9acb6679` recent documents dwell · `7983de9e1` URL without RSC requests |
| `com.etendoerp.metadata` | `9ef6dea` menu body ETag (ship before the UI) |

Measured with `perf:compare` (Sales Invoice, CPU 4x) against the previous state:

- Menu: a reload costs 308 B instead of 244 KB.
- Form Next (`perf/render-count.mjs`, one Next): FormView 12 → 6 renders. FormView subscribed to the whole toolbar
  slot (now `useToolbarCommands` + one selector), Tab re-rendered it with the same props (now `React.memo`), and
  `BaseSelector` called `useParams()` for a `recordId` route segment that does not exist (always undefined; it only
  re-rendered every field on each URL change). `form-next-5` blocking −15 %, `open-record` −18 %. The ≈190 ms "form
  reset" estimate below was wrong: `reset()` itself is ≈27 ms per Next; the cost was the re-renders.
- Evaluation contexts: 31 builds per Next from 13 distinct inputs (each consumer took its own snapshot of the same
  values). `getEvaluationContext` now reuses a recent record with the same content; 12 builds, none repeated.
  CPU change within noise (≈−7 % `form-next-5`).

Tried and dropped — **stable react-hook-form context** (fields re-render with every FormView render because
`FormProvider` passes `{ ...props }`). Working version: own provider for RHF's context, `formState` readers moved to
`useFormState`. Field renders only 348 → 318 per Next, CPU within noise, and two traps:
`reset()` empties RHF's field registry (`_fields`, `_names.mount`), and a field registers again only when it
re-renders — with a fully stable context, typing into a field whose value did not change across the reset (Sales
Order description) did nothing, so the context must still change once per reset. And `NumericSelector` passes the
RHF ref to a controlled input: `reset()` writes the raw value ("0" for "0.00") into the DOM, hidden today only by
re-renders. Not worth the risk; the remaining field re-renders come from the form initialization context and
TabContext.

Grid keyboard navigation (`8f9b06042`): **MRT 2.13 rebuilds its column definitions on every render**
(`prepareColumns` in `useMRT_TableInstance`, no memo), so every DynamicTable render hands TanStack new cells and
repaints all visible cells — `memoMode: "cells"` (phase 4) never matches. One ArrowDown repainted ~460 cells 4–6
times. Removed two causes: `useThrottledCallback` depended on its inline callback (the grid's columns changed every
render), and the grid subscribed to the session (changed by every SETSESSION) although only editable cells read it.
`arrow-nav-5` time −27 %, blocking −12 %.

Tried and dropped — **pnpm patch memoizing MRT's column defs** (reuse them while the user columns and the options
the display columns read are unchanged) plus a stable actions column: dev renders per ArrowDown 19.6k → 15.3k
fibers and no full repaints, but two `perf:compare` runs gave `arrow-nav-5` −10 % and +12 %: within this step's
noise (the base alone varied 724–843 ms blocking). Not worth patching a dependency. The patch is kept outside the
repo; MRT 3 (MUI 6) may make it moot.

Form Next requests (`4190928cf`, `b9acb6679`, `7983de9e1`): `form-next-5` 23 → 9 requests, all Sales Invoice
steps 81 → 63 (CPU unchanged locally; each request saved is a round trip on remote servers).

- **Bug fixed:** `useFormInitialization` ignored a params change while a FIC request was in flight and never
  retried, so after a quick double Next on a slow server the record shown had no FIC of its own and got the
  previous record's response (reproduced with the FIC delayed 1.5 s via `page.route`). Stale responses are now
  dropped and the latest params fetched when a request ends; intermediate records are skipped.
- Recent documents are tracked after the record stays open 1 s (one POST per record passed over before).
- The window store → URL sync used `router.replace`, which made App Router fetch the `/window` RSC payload (the
  `GET /window` lines in `byEndpoint`: two per form Next). Once on `/window` it uses `history.replaceState`.

## Round 2 status (merged)

Round 2 is implemented, committed and **not pushed**; no PR is open yet.

| Repo | Branch (from `main`) | Commits |
|---|---|---|
| `com.etendorx.workspace-ui` | `hotfix/ETP-5641` | `328275f06` metadata HTTP revalidation · `4d6ed3979` select hooks `useWatch` + bench steps + grid design · `2b0f97e73` shared evaluation context · `7e4c4f98b` toolbar commands / grid re-renders · `79d15d2ef` arrow navigation scroll |
| `com.etendoerp.metadata` (`~/Dev/Work/etendo_26/modules/com.etendoerp.metadata`) | `hotfix/ETP-5641` | `048d107` body ETag for `GET /meta/window`, `/meta/tab` |

The two PRs are independent: the UI works against an old module (GET without ETag → always 200) and the module keeps
POST unchanged for an old UI. Ship the module first to get the 304s.

What round 2 changed and measured (details in §2.0 and the "Done (round 2)" rows of §2.1–2.2):

- Window/tab metadata: GET + body ETag + browser HTTP cache; in-memory definitions instead of localStorage. A reload
  costs 308 B instead of 1–3 MB per window. In DevTools the revalidated request shows **status 200** with ~308 B
  transferred (Chrome hands the cached copy to `fetch`); "Disable cache" must be off to see it.
- Shared evaluation context across fields (`utils/evaluation/sharedEvaluationContext.ts`): context-build CPU −63–72 %
  in form steps; form-next-5 blocking −13–27 %.
- `useToolbarCommands()` + `React.memo(DynamicTable)`: hidden grid 11 → 4 renders per Next; `perf:compare` vs the
  previous commit: total blocking CPU −17 %, total time −10 %, arrow-nav-5 −34–43 %.
- Arrow navigation keeps the selected row in view on every step (`utils/table/scrollRowIntoContainer.ts`). MRT 2 has no
  `table.rowVirtualizer`: use `rowVirtualizerInstanceRef` (now passed to the table).
- Select hooks use `useWatch` (no measurable change); bench gained `new-record` and `select-change`.

Verified: full MainUI Jest suite (470 suites / 6,163 tests), `tsc`, module unit tests, manual check by the user
(toolbar, arrow navigation, selects, display logic basics). **Not yet run:** `pnpm apply:data-testid` (CI checks it),
the Playwright e2e suites (display/read-only logic, processes, inline edit are covered there — run them in CI on the
PR), a 4-window `perf:compare` reference.

### Next steps, in suggested order

1. **Open the PRs** (Git Police: titles `Hotfix ETP-5641: …`, target `main`): run `pnpm apply:data-testid` and
   `pnpm check`, push both branches, paste a `pnpm perf:compare` report (4 windows, 3 rounds, `CPU_THROTTLE=4`) in the
   UI PR's Performance section, then fix whatever the e2e suites report.
2. ~~**Menu revalidation**~~ **Done (round 3, local, not pushed):** `/meta/menu` answers GET with the body ETag
   (`MenuService` → `writeWithETag`); the old menu fingerprint (`HttpCacheSupport.fingerprintMenu`, missed role
   access changes) is removed; the UI fetches the menu with GET and the proxy passes it through like window/tab.
   A reload now costs 308 B instead of 244 KB for the menu (checked in Chromium against a production build).
   Ship the module before the UI: with an older module the GET hits the old fingerprint ETag.
3. ~~**Form reset/initialization**~~ **Done (round 3):** see §0 (the cost was re-renders, not `reset()`).
4. ~~**Once-per-pass evaluation contexts**~~ **Done (round 3):** see §0.
5. **Grid `_selectedProperties`**: design in `2026-10-08-grid-selected-properties-design.md`, waiting for review —
   do not start without it (rows feed ~15 backend payloads).
6. Smaller items in §2.1–2.3: gzip for API JSON (infra), process definitions embedded in buttons (module), ~~one FIC +
   one recent-documents request per form Next~~ (done in round 3, see §0), process modals, date formatting per cell, the three bugs in §2.3
   (`auxiliaryInputs` never reset, `TEMP DEBUG` leftovers, select closing on re-init).

### Lessons from round 2 (avoid repeating them)

- **New auto-saves a dirty form.** Never click New/Next on a form a script typed into; check `max(updated)` of the
  touched tables before/after a scripted run. (The local test records it modified are fine as they are.)
- Production builds strip `console.*` (`removeConsole`): temporary instrumentation must write to a `window` array.
- `useToolbarContext()` returns a new object every render — an identity change of its result is a consequence, not a
  cause; look at the store slot it subscribes to.
- `perf:compare` flags request-count changes in `arrow-nav-5` that are only SETSESSION debounce timing (3–7 per run on
  both sides); check `byEndpoint` per round before treating them as regressions.
- Jest compiles object spread to `Object.assign`, which differs from native spread for an own `__proto__` key.

## 1. What is already done (PR #955)

| Phase | Change | Effect (CPU 4x) | Design |
|---|---|---|---|
| 1 | Linear evaluation context (`utils/evaluation/`), built once per render / pass / record | Sales Invoice open record 47.9 s → 2.2 s | `docs/features/expression-evaluation/2026-10-06-phase-1-linear-context-design.md` |
| 2 | Form values out of `TabContext` (`contexts/tabFormValuesStore.ts`, `hooks/useTabFormValues.ts`); toolbar subscribes only to its dependencies | typing −69% | `…/2026-10-08-phase-2-render-isolation-design.md` |
| 3 | Hidden grid skips re-renders (`hooks/table/useFrozenWhileHidden.ts`, refreshes on rows/selection change); no-op session merges keep the same object | open record −42–46% | `…/2026-10-08-phase-3-open-record-design.md` |
| 4 | Selection side effects settle 400 ms like Classic (`hooks/useSettledValue.ts`, `hooks/table/useSettledParent.ts`); no toolbar FIC in form view; linked items only when open; grid `memoMode: "cells"` | fast navigation: 11 → 7 requests (grid), 27 → 13 (form Next) | `…/2026-10-08-phase-4-selection-settling-design.md` |
| 5 | Render-time `watch(name)` → `useWatch` in selectors; `useDisplayLogicFormValues` for header/sections | typing −52–65% more, blocking 0 | `…/2026-10-08-phase-5-local-form-subscriptions-design.md` |

Whole PR vs `main` before it (Sales Invoice, no throttle, `perf:compare QUICK=1`): open record 13.5 s → 0.1 s,
5× form Next 124.6 s → 1.5 s, typing 10 chars 23.4 s → 0.05 s, requests 99 → 75.

## 2. Pending work

### 2.0 Done in round 2: window/tab metadata revalidated with a body ETag

Two repos, both on branch `hotfix/ETP-5641`:

- `com.etendoerp.metadata`: `GET /meta/window/{id}` and `GET /meta/tab/{id}` answer with
  `ETag` = SHA-256 of the body and `Cache-Control: private, no-cache`; a matching `If-None-Match` gets
  `304` without a body (`MetadataService.writeWithETag`, `HttpCacheSupport.computeBodyETag`). POST keeps
  the old behaviour, so an older UI is unaffected.
  - Why a body hash and not an AD fingerprint (Classic style: language + module versions + access): the
    window JSON embeds business data — legacy process parameters of table/tabledir type carry their combo
    values (`selector.response`, e.g. Sales Invoice `copyFrom` with 82 records, used as `staticOptions` in
    `ProcessParameterSelector.tsx:280`). An AD-only fingerprint would serve stale combos. The body hash is
    correct by construction, but the server still builds the JSON on every request.
  - `recordTime` (serialization timestamp stamped by `DataToJsonConverter` on every entity, 1,415 times in
    Sales Invoice) is replaced by `0` before hashing; otherwise the ETag changed on every request.
  - The 304 is committed with `flushBuffer()`: core `BaseWebServiceServlet.doService` sets status 200 after
    every service, which turned an uncommitted 304 into an empty 200. This also affected the existing
    menu/session/labels ETag in `MetadataServlet` (latent: no client sends `If-None-Match` there yet).
- UI: `Metadata` fetches window/tab with GET (`api-client/src/api/metadata.ts`) and keeps them in an
  in-memory `Map` instead of localStorage (removes the duplication, the quota overflow and the per-read
  `JSON.parse`); persisted copies from older versions are deleted in `setBaseUrl`. The `/api/erp` proxy
  sends `GET meta/window|tab/*` through `handleRevalidatedMetadataRequest`: no Next.js Data Cache, forwards
  `If-None-Match`, returns the ERP status (304) with `ETag` / `Cache-Control`. The browser HTTP cache does
  the rest (the `language` query param keeps languages apart; the role is in the body hash).

Results (Sales Invoice + Sales Order, 3 runs, `etp5641-metacache-{base,head}-cpu{1x,4x}-*.json`):

| Step | API bytes | Visible (1x) | Visible (4x) |
|---|---|---|---|
| Sales Invoice / reload-warm | 3,377 KB → 319 KB (window: 3.1 MB → 308 B, a 304) | 974 → 871 ms | 2,288 → 2,163 ms |
| Sales Order / reload-warm | 2,466 KB → 314 KB | 910 → 906 ms | 2,174 → 2,000 ms |
| open-cold (both) | unchanged (first download) | 2,738 → 1,876 / 1,956 → 1,521 ms (noise: server generation varies) | ~unchanged |
| Total API bytes, all steps | 13,145 KB → 7,943 KB (−40%) | 13.1 s → 11.4 s | 24.0 s → 24.2 s (noise) |

Locally the transfer is almost free, so time barely moves; the gain is bytes. On the demo server (no gzip,
~260 ms RTT) each window reload should save 1–3 MB of download (not measured there yet).

Follow-ups:

- ~~**Menu still re-downloaded on every reload (244 KB)**~~ **Done (round 3):** menu via GET with the body
  ETag + proxy pass-through; `useMenu`'s forced refresh stays and is now a 304 (308 B). The fingerprint ETag
  (`role | language | max(ADMenu.updated)`) was dropped: it missed role access changes.
- **Server generation is still paid on every revalidation** (~0.3–0.6 s locally per window, 7–10× on demo).
  Avoiding it needs a fingerprint ETag, which needs the legacy combo values moved out of the window
  metadata into an on-demand request (process modal change).
- gzip for API JSON (infra) is still the biggest win for `open-cold`.

### 2.1 Network and metadata (largest remaining cost; dominates on the demo server)

Measured on demo (2026-10-01): window metadata 1.2–3.4 MB uncompressed per window; demo generates it 7–10×
slower than a local Tomcat; navigation cost is ~4 s per window with either UI.

| Item | Where | Evidence / expected gain |
|---|---|---|
| gzip for API JSON | infra (Apache / Next proxy `app/api/erp`, `app/api/meta`) | HTML is compressed, JSON is not; Sales Invoice metadata 3.4 MB → ~365 KB |
| ~~Metadata cache is written but never read~~ **Done (round 2, window/tab part)** | see §2.0 | menu part done in round 3 (GET + body ETag, a reload revalidates it with a 304) |
| ~~Cache stores window and tabs duplicated, overflows localStorage (5 MB)~~ **Done (round 2)** | see §2.0 | window/tab definitions now live in memory; old persisted copies are removed on start |
| ~~`CacheStore.get` parses the whole window JSON on every call~~ **Done for window/tab (round 2)** | see §2.0 | `getCachedWindow` / `getColumns` / `getTab` read an in-memory `Map`; other `CacheStore` keys (menu, labels, toolbar) still parse on read, but they are small |
| Grid fetches all 182 properties per row | grid datasource (`hooks/table/useTableData.tsx`, `useDatasource`) | Sales Invoice page: 506 KB; visible columns only ~66 KB (`_selectedProperties`); 37 rows measured: 187 KB / 221 ms server → 37 KB / 37 ms. Not a parameter change: grid rows are used as full records in ~15 backend payloads. Design: `2026-10-08-grid-selected-properties-design.md` |
| Process definitions embedded in every button; each process parameter embeds a whole window; 69 properties per column | module `com.etendoerp.metadata` (Java, `WindowBuilder`) + UI on-demand loading | ~670 KB of the 1.07 MB Sales Order header tab; 215 KB for Add Payment alone |
| Duplicate requests | `useTreeModeMetadata` (`hooks/useTreeModeMetadata.ts`, via `Metadata.getTab`) re-requests a tab (up to 1.36 MB) only to read whether it is a tree — `getTab` checks the cache first, so this request was a symptom of the quota overflow above (now in memory; not seen in the round 2 runs); FIC and navigation repeated on open record | see `perf/results/*` `byEndpoint` |

### 2.2 Form, selection and grid (frontend CPU)

| Item | Where | Evidence |
|---|---|---|
| ~~Four hooks still call `watch(name)` while rendering~~ **Done (round 2)** | `useFieldValue`, `useComboSelect`, `useSelectFieldOptions`, `useTableDirDatasource` use `useWatch`; `hooks/__tests__/fieldSubscriptions.isolation.test.tsx` fails on the old code (the form host re-rendered) | no measurable change in the new `select-change` step (4x: ~250 ms, ~110 ms blocking before and after): the step is already cheap after phases 2–5 (144 ms busy CPU, 67 ms of it GC, < 10 ms per first-party file) |
| `FormProvider` gets a new value on every `FormView` render, re-rendering every `useFormContext()` consumer | `components/Form/FormView/index.tsx:1201` (`{...form}` plus `formState`); memory note "useFormContext unstable identity" | any root render (formState changes, the four hooks above) cascades to all fields; **not pursued**: RHF 7.62 builds the context value inside `FormProvider` and its children are the whole form, so a stable value needs a FormView restructure, and the select/typing steps no longer show the cascade |
| ~~Per-field evaluation contexts~~ **Done (round 2)** | `utils/evaluation/sharedEvaluationContext.ts` (`getEvaluationContext`), used by `hooks/useDisplayLogic.ts` and `BaseSelector.tsx` read-only logic | each field used to rebuild the context from `{ ...record, ...deps }` (record ≈180 keys: 0.21 ms per build vs 0.025 ms for the deps alone, 127 builds per pass in Sales Invoice). Now one context per record is shared when the deps repeat record values, and per primitive overlay otherwise; a write through a shared proxy evicts it. Equivalence: `__tests__/sharedEvaluationContext.differential.test.ts` (seeded overlays against a fresh build, harness in `__mocks__/differentialHarness.ts`). Sales Invoice 4x, 3 profiled runs, CPU inside the builder: form-next-5 1,669 → 474 ms, new-record 551 → 203 ms, open-record 222 → 81 ms. Blocking time (`etp5641-evalctx-{base,head}-cpu4x-*`): form-next-5 −27 % / −21 % / −13 % (SI / SO / PO, run ranges do not overlap), new-record SI −12 %. Left: once-per-pass builds (toolbar ≈36 ms per step at 4x, form validation, FormHeader / FormFields), which receive the whole form values |
| Hidden grid re-rendered ~10 times per form Next — **Done (round 2)** | `useToolbarContext()` subscribed every caller to the whole toolbar store slot (save button state, registered actions, form refetch...): `DynamicTable`, `Tab`, `useTableData`, `useDeleteRecord`, `UnsavedChangesTabGuard`, `StatusBar` only call commands. They use the new `useToolbarCommands()` (stable, no subscription, runs the implementation registered at call time; `contexts/__tests__/ToolbarContext.commands.test.tsx`). `DynamicTable` is `React.memo` (Tab re-rendered it with the same props); `SummaryRow` asks for the column model only when summaries exist | render-cause count (one Next, Sales Invoice): hidden header grid 11 → 4 renders, Tab 11 → 6. `perf:compare` working tree vs `2b0f97e73` (3 windows, 3 rounds, 4x): total blocking CPU −17.1 %, total time −9.6 %; arrow-nav-5 blocking −34 % to −43 %, form-next-5 −17 % / −23 % (SI / SO), open-cold and reload-warm −12 % to −16 %. Flagged by the tool: Sales Order arrow-nav-5 requests 6 → 8 — only `SETSESSION` varies (3–7 per run on both sides, set by how the 400 ms debounce groups the keys), the datasource count is constant |
| Grid repaints every row on a selection change | MRT rows (`components/Table/index.tsx`), MUI/emotion `sx` per row, select checkbox and actions display columns | ~0.5 s blocking per ArrowDown at 4x after all fixes; options: CSS-only selection highlight, lighter row/checkbox components, row memo with selection-aware comparator |
| Form Next: one FIC + one recent-documents request per record | `hooks/useFormInitialization.ts`, recent documents store | 5 Next → 5 FIC + 5 recent-documents; could settle like phase 4 (leading + trailing) |
| `SETSESSION` almost once per arrow on slow machines | `hooks/useTableSelection.ts` (debounce now 400 ms) | each key takes > 400 ms to process at 4x, so the debounce rarely coalesces; key auto-repeat does coalesce (not measured) |
| Process modals untouched | under `components/ProcessModal/`: `ProcessDefinitionModal.tsx:246,785,816`, `ParameterDialogHost.tsx:108`, `hooks/useProcessFICCallout.ts:96`, `callouts/useProcessCallouts.ts:93`, `utils/processExpressionUtils.ts:53`, `hooks/useGridRowValidation.ts`; render-time `watch(name)` in `selectors/GenericSelector.tsx:36-37`, `selectors/RadioSelector.tsx:27` | whole-form `form.watch()`, one context per parameter / per `isParamDisplayed` call / per grid row |
| Date formatting per cell render | `ComponentLibrary/src/utils/dateFormatter.ts:84,139` | 3–5% of grid-heavy steps; memoize per value |

### 2.3 Bugs found along the way (not performance)

- A select dropdown opened while a new record is being saved closes when the form re-initializes (also on
  `main`; reproducible with 800 ms network latency). The FINc smoke test now reopens it.
- `TabContext.auxiliaryInputs` is never reset when the form closes, so the last form record's aux values
  keep overriding the toolbar's grid fetch.
- Leftover `TEMP DEBUG` (ETP-4625) logging in `LinkedItemsSection.tsx` (document click listener),
  `components/Table/index.tsx` (single-record auto-select), `components/window/Tabs.tsx`,
  `hooks/useGlobalUrlStateRecovery.ts` and `utils/recovery/urlStateParser.ts` (`grep -rn "TEMP DEBUG"`).

### 2.4 Benchmark and tooling

- Turn the manual functional checks into `@smoke` e2e tests: inline grid edit (enter, type, cancel), form
  Next/Previous replacing every field, typing, select change, arrow navigation highlight.
- Run a full `pnpm perf:compare` (4 windows, 3 rounds) as a reference for the next round.
- Round 2 added two `bench.mjs` steps, `new-record` (New from the form, FIC NEW) and `select-change` (pick another
  Payment Terms value on that new record; skipped in Goods Shipment; opening the list and loading options is setup).
  **They first ran after `type-10-chars`, and New auto-saves a dirty form: those runs saved the typed text into
  real records** (description = "perf-check" repeated in c_invoice I/33, I/14, I/26; c_order 50005, 800005; m_inout
  500005 — the original descriptions were empty), and `new-record` measured save + New (~1.2 s at 4x instead of
  ~0.6 s). The order is now `form-next-5` → `new-record` → `select-change` → `type-10-chars` (typing into the new
  record, never saved); a run was checked to leave `max(updated)` of those tables unchanged. `new-record` numbers in
  `etp5641-formwatch-*` and `etp5641-evalctx-*` include the save. `SCREENSHOT_ON_ERROR=1` saves a screenshot when
  a window flow fails.

### 2.5 Security (from the original analysis; separate tickets)

JWT in localStorage without expiry (move to an HttpOnly cookie with expiry); no CSP / X-Frame-Options at
app level; `ToastContent` renders server HTML unsanitized; metadata exposes `@SQL` defaults, sqllogic and
where clauses; login endpoint with `CORS *`.

## 3. Tools

All under `playwright-tests/perf/` (see its `README.md`). Prefix node / pnpm with `env -u NODE_OPTIONS` if the
shell injects a `NODE_OPTIONS` preload that no longer exists.

| Tool | Use |
|---|---|
| `node perf/bench.mjs` | Real Chromium flows per window: `login`, `open-cold`, `reload-warm`, `load-unfiltered`, `arrow-nav-5`, `open-record`, `form-next-5`, `type-10-chars`. Records visible / settled / interactive time, blocking CPU (TBT-style), long tasks, requests, bytes, server wait, per-endpoint breakdown. Env: `BASE_URL`, `RUNS`, `WINDOWS`, `CPU_THROTTLE`, `LABEL`, `PROFILE=1` (one `.cpuprofile` per step), `OUT_FILE`, `FLAVOR=classic` (Classic at `:8080/etendo`). |
| `node perf/compare.mjs a.json b.json` | Per-step and total % change between two result files. |
| `node perf/hotspots.mjs <profile-dir> ../packages/MainUI/.next [filter]` | CPU by function / first-party file, mapped through production source maps (build with `SOURCE_MAPS=true pnpm build`). `CALLERS=<function>` prints the call stacks into a function (e.g. `getBoundingClientRect`). `CALLERS_OF=<source path>` attributes all time inside a file (inclusive) to its nearest first-party callers outside it — works with minified function names. |
| `pnpm perf:compare` | Branch vs its base on the same machine: builds the base in a cached worktree (`~/.cache/workspace-ui-perf-compare/`), alternates runs, bootstrap statistics, Markdown report for the PR. `QUICK=1`, `ROUNDS`, `WINDOWS`, `CPU_THROTTLE`, `BASE_REF`, `SKIP_BUILD=1`, `STRICT=1`. |
| Pre-push hook (`.githooks/pre-push`) | Warns when a branch touches `perf/sensitive-paths.txt`; never blocks. |
| `pnpm test:perf` | Unit tests of the comparison statistics and path matching (`node --test`). |
| Committed results | `perf/results/*.json`: baselines (`local-react-*`, `local-classic-*`, `local-classic-shellskin-*`, `demo-*`) and every phase (`etp5641-*`). |

Techniques that worked (not committed as tools):

- **Render-cause instrumentation:** a temporary `useWhyRender(name, values)` hook that logs which of the
  given values changed identity on each render, dropped into `FormView`, `FormHeader`, `Toolbar`,
  `DynamicTable`, `BaseSelector`, run against `next dev` and driven by a Playwright script that sets
  `window.__WHY = true` right before the interaction. It found the `TabContext` and `watch()` cascades (round 1)
  and the toolbar-store re-renders of the hidden grid (round 2). Against a production build, write to a
  `window.__WHYLOG` array instead of `console` (stripped by `removeConsole`).
- **Reproducing CI timing locally:** in a copy of an e2e test, open a CDP session and add
  `Emulation.setCPUThrottlingRate` plus `Network.emulateNetworkConditions` (`latency: 800`); compare the
  branch build with the base build served from the `perf:compare` worktree.
- **Production builds for measuring:** `pnpm build` then `npx next start -p 3100` in `packages/MainUI`
  (port 3000 may be taken by another dev server). `next build` rewrites `next-env.d.ts`; revert it.

## 4. Environment notes (local)

- Etendo Classic (backend) on `http://localhost:8080/etendo` (Tomcat), user `admin` / `admin`.
- Module unit tests: `./gradlew test --tests 'com.etendoerp.metadata.…'` from the Etendo root. In this
  environment `compileTestJava` fails on `modules/com.smf.ticketbai/src-test/.../battery` (needs
  `com.etendoerp.sif` test classes); move that folder aside while running the tests and put it back.
- Jest: `pnpm jest <paths> --selectProjects MainUI` (paths before the flag).
- CI: GitHub Actions (build, Git Police, Sonar) and Jenkins ("New UI Tests" runs unit tests and the
  data-testid codemod check — run `pnpm apply:data-testid` before pushing; "Playwright Tests" runs the e2e
  suites against an Etendo backend). Local data makes `FINcFinancialAccountAddTransactionTest` and
  `FINdPaymentProposalTest` fail at later steps on `main` too, so validate those in CI.
