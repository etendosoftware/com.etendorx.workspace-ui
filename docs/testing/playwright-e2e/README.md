# Playwright E2E suite

End-to-end tests of the new UI against a running Etendo Classic backend, in `playwright-tests/`. CI runs the whole
suite on every PR in the `playwright-automation` Jenkins job (GitHub check "Playwright Tests"), on a freshly
installed ERP with the QA_Testing sample data and no extra modules.

Conventions for writing specs (folder layout, selector and waiting policies, recipes, how to run one spec):
[playwright-tests/CLAUDE.md](../../../playwright-tests/CLAUDE.md). Test-ID rules for components:
[data-testid-check.md](../../data-testid-check.md).

_Last updated: 2026-10-21 (ETP-5832: feature probes, regression tier, mocked-backend layer)._

## Behavior

- **Projects run in order** through `dependencies`: `support-unit` (registry/helper unit tests, no browser) →
  performance → base (login, master data, filters, linked items, feature probes) → sales → procurement →
  financial → then, side by side, `suite-05-regression` and `mocked`.
- **Two tiers, tagged in the `describe` title**: `@smoke` (every PR) and `@regression` (slower or rarer checks).
  Feature probes also carry one area tag: `@process`, `@form`, `@grid`, `@nav` or `@session`
  (`e2e/support/tags.ts`; `support/__tests__/tags.spec.ts` fails when a spec misses the tags of its folder). See
  [Tiers and tags](#tiers-and-tags).
- **Feature probes** are short specs (10–25 s) that open one window and check several behaviors of one area
  without running a document flow. See [Feature probes](#feature-probes).
- **Spec files of a project run in parallel**, up to the project's `workers` (3 for the smoke projects, 2 for
  performance; 3 is also the global limit). Each spec selects only the documents it created. See
  [Grouping and parallelism](#grouping-and-parallelism).
- **Every test starts logged out** and logs in through the UI with role "QA Testing Admin" / organization "Spain"
  (the `app` fixture). No session is shared between tests.
- **Specs combine support components** (`e2e/support`): sidebar navigation through a window registry, toolbar
  actions and process menu entries found by label, form fields by label or AD_Field_ID, process modals (React and
  legacy), Classic "Create Lines From", lookups.
- **Static checks** run in CI before the ERP is installed (stage "Playwright Static Checks"): `tsc --noEmit` and the
  `check:e2e` ratchet, which fails when a count of unstable patterns (fixed sleeps, `force: true`, swallowed
  errors, hash test IDs, CSS-chain selectors, native value setter) goes above `e2e-ratchet.baseline.json`.
- **Flaky tests are reported**: retries stay at 2 on CI; the `flaky-summary` reporter lists the tests that passed
  only after a retry and writes `test-results/flaky-tests.json`.

## Decisions

| Decision | Reason |
|---|---|
| Login per test, no `storageState` | Specs change the role, the default role and even the user (ADMa); the Classic session keeps that context server side. |
| `{ timeout }` test details removed instead of turned into `test.setTimeout` | The option never existed (Playwright ignored it); every requested value was ≤ the project timeout that actually applied, so removing it keeps the effective timeouts. |
| Records a spec creates use `uniqueValue()` keys | Local databases are reused and `--repeat-each` runs a spec several times; fixed keys collide with unique constraints (e.g. payment term name per organization). |
| Legacy OK waits for the submit response | The wrapper modal's Close button is always on screen; closing it while the submit is in flight cancels the process request. |
| After a successful legacy process, wait for the modal to close by itself | It auto-closes ~3 s after the success message; clicking Close meanwhile left the record without selection (toolbar buttons disabled). |
| Stable `data-testid` only where no role/label exists | Codemod hash IDs change when a component file moves; Tailwind/MUI classes change with styling. |
| `toolbar.save()` waits for the save and, for a new record, for its reload | The form reloads a new record right after saving it; a field changed in between (e.g. the payment method right after saving a header) was overwritten and the next save found nothing to save. |
| Keyboard picks reach the option by its position | A search can match several options ("1 (Spain)" also matches "2.1 (Spain)"); pressing ArrowDown once picked the second match. |
| Parallelism inside a project, projects still in sequence; 3 workers at most | See [Grouping and parallelism](#grouping-and-parallelism). |
| Retries kept, flakiness made visible | Removing retries or failing on flaky tests would block PRs on infrastructure noise; the summary keeps it visible. |
| Tags in the `describe` title, not Playwright's `tag` option | Same mechanism the smoke specs already used; `--grep` matches them either way. |
| `suite-05-regression` is a leaf project | Playwright runs dependency projects in full and ignores `--grep` there; only a project nothing depends on can be filtered out with `--grep-invert @regression`. |
| Data a probe does not test is created through the datasource (`api` fixture) | Much faster than the UI and it keeps the probe on the behavior it checks. It needs a UI login first: the CSRF token of the server-side session is set by the app's own startup requests. |
| Read-only probes and probes on their own records go to `suite-01-base` | That project waits for its longest spec (ADMb), so short probes fill idle workers almost for free. |
| A probe never takes "the first row" and never changes the user's defaults | Projects run 3 specs in parallel on one database: probes filter by their own records or fixed sample documents, and SESa never ticks "Save as default". |
| Client behavior the bare core has no data for is injected into the metadata (`support/processOverrides.ts`) | The core ships no migrated `em_etmeta_onprocess`; PRCb and PRCd set one in the window/process metadata the UI loads, and block the Java handler so nothing executes. |
| Global configuration a probe needs is created for the user and the window only, and removed in `afterEach` | GRDd enables `OBUIAPP_GroupingEnabled` (only the F&B sample client has it); `afterEach` still runs with the page open when a test times out, a `finally` does not. |

## Grouping and parallelism

All specs share one ERP database. Projects (`playwright.config.ts`) run one after another through `dependencies`;
inside a project, spec files run in parallel up to the project's `workers`.

| Project | Specs | Workers | Shared data and why |
|---|---|---|---|
| `support-unit` | registry and helper unit tests | default | No browser, no ERP. |
| `suite-00-performance` | `performance/` | 2 | Measures timings: runs first and alone so no smoke spec loads the server while it measures. Kept at the value it had. |
| `suite-01-base` | login, master data, filters, linked items, display logic, `@smoke` feature probes | 3 | Read-only specs, or records with `uniqueValue()` names. |
| `suite-02-sales` | SALa–SALd | 3 | Customer Barcelona and Customer A; each spec selects only its own orders, shipments and invoices. |
| `suite-03-procurement` | PROa–PROe | 3 | Vendor A; each spec filters by its own document numbers. PROe runs the client-wide "Costing Background" process, which does not change the others' documents. |
| `suite-04-financial` | FINb–FINe | 3 | Customer A, Vendor A/B, Spain Cashbook; each spec selects only its own invoices and payments. FINe (Match Statement) is the only spec on Spain Bank: the matching algorithm runs on every unmatched line of the account. Its tests run in order (`mode: "serial"`) on one statement. |
| `suite-05-regression` | `regression/` | 3 | `@regression` probes, each on its own records or on a window no other spec uses (Currency for saved views, Country and Region for grouping). |
| `mocked` | `mocked/` | default | Recorded responses only: no ERP needed. Run it alone with `pnpm pw:mocked`. |

**Why projects stay in sequence.** Different projects share business partners and their pending documents and
credits: SALb and FINb both complete Customer A invoices and handle the credit FINb generates; procurement and
financial both pay Vendor A invoices. Keeping them in separate, sequential projects means only specs reviewed
together ever overlap.

**Why 3 workers.** In CI the browsers run in the same pod as the UI, Tomcat and the database (4 CPUs, 2 guaranteed,
on a Jenkins shared with other jobs). Each worker is one more browser competing with the server: with 3 workers
every test ran 5–10% slower locally while the suite finished ~17% sooner (8.6 → 7.0–7.2 min, three full runs and a
SALa/SALc ×5 parallel stress run, no retries, no failures). More workers would make responses slower and turn waits
into timeouts. The global `workers: 3` caps the total.

**Adding a spec**

1. Put it in the project of its business area (its folder).
2. It must select and process only records it created: filter grids by its own document number, never take "the first
   row" or "all rows". Shared forms list every spec's documents (Classic "Create Shipments from Orders" lists every
   booked order of the day; SALc checks only its own).
3. If it must process every pending document, or change global configuration other specs read, give it its own
   project with `workers: 1`, depending on the previous project and with the next one depending on it.
4. Run it in parallel with the rest of its project: `pnpm exec playwright test <spec> <other specs> --no-deps
   --repeat-each=5 --retries=0`.

**Changing `workers`.** Raise it only after several local full runs without retries and a CI run whose flaky summary
(`test-results/flaky-tests.json`) stays empty; tests that pass only after a retry in CI are the first sign of too
many workers for the pod.

## Tiers and tags

| Tag | Meaning |
|---|---|
| `@smoke` | Runs on every PR. Business flows (`smoke/0N_*`) and feature probes (`smoke/08_Process` … `12_Session`). |
| `@regression` | Slower or rarer checks (`regression/<area>/`), in the leaf project `suite-05-regression`. |
| `@process` `@form` `@grid` `@nav` `@session` | Area of a feature probe; the folder decides it (`AREA_FOLDERS` in `support/tags.ts`). |

The CI job still runs every project (the PR budget below is met). To leave the regression tier out of a run:
`pnpm exec playwright test --grep-invert @regression`.

## Feature probes

| Spec | Tier | Checks | Data |
|---|---|---|---|
| PRCb | smoke | Pick and Execute grid (Add Payment): selecting allocates the amount, deselecting gives it back, a numeric cell is editable, a migrated onProcess that fails stops the execution | Own payment header; the payment request is blocked |
| FRMa | smoke | Display logic of fields (Product: Stocked, Bill of Materials, Linked To Product, Tax Category) and of a child tab (Bill of Materials) re-evaluated after a field change, unsaved | Sample product, not saved |
| FRMb | smoke | Editability by document status: a draft sales order is editable, a booked one read-only, "Copy Lines" only while not processed | Sample orders 50015 and 50017 |
| FRMc | smoke | Save → reload round trip of text, dates, integer, yes/no, list, table, number, price and quantity fields (Discounts and Promotions) | Own record |
| FRMe | smoke | Selector buttons in a form: the magnifying glass picks a record filtered in its popup (Sales Order business partner); the "+" opens the process that creates the record in the context of the form (Transaction payment → Add Payment, paid out from the account) | Sample records, not saved |
| GRDa | smoke | Child tab follows the header selection, clone with lines, backend sort, inline edit with its callout, refresh after save | Clone of sample order 50014 |
| GRDb | smoke | Delete one and two records from the grid, unsaved-changes guard when closing a window, no deleted record back after reopening | Own categories (`api`) |
| NAVa | smoke | Deep link in a fresh session, URL recovery after a reload, switching open windows keeps their record | Sample records |
| SESa | smoke | Organization/warehouse switch (context of new records), role switch (menu), defaults kept after a new login | None ("Save as default" never ticked) |
| PRCc | regression | OBUIAPP_Report from the menu (Payables Aging Schedule): defaults, PDF download, modal kept open | None |
| PRCd | regression | Manual process (Open Close Periods): "not migrated" message without a script; a migrated script runs with the selection and the `OB` shim | Sample period; scripts set by override, handler blocked |
| FRMd | regression | Notes and attachments of a record: add and delete | Own category |
| GRDc | regression | Saved views: save, standard view, apply, default applied when the window opens | Own view, deleted after the test |
| GRDd | regression | Count summary and grouping by a column add up to the grid rows | Grouping preference for the user and window, removed after the test |
| GRDe | regression | Tree view drag and drop: a node dropped in the middle of another becomes its child | Own product categories |
| NAVb | regression | Keyboard shortcuts of the core preference: select/unselect all, refresh, next record, new and save | Own categories |
| NAVc | regression | Status bar previous/next and its "N / M" counter | Own categories |

Not covered, on purpose:

- **Funds Transfer (PRCa)**: dropped while two bugs are open (see [Known issues](#known-issues)).
- **Multi Selector and DateTime fields** in FRMc: no window of the bare core with a creatable record has them (only
  process parameters do).
- **Read-only logic driven by another field**: in the bare core, every field whose read-only logic depends on an
  editable field is hidden whenever that logic is true; FRMb covers read-only logic by document status.

Pure helpers the probes rely on are covered by table-driven Jest tests in the "New UI Tests" job, not by Playwright:
`utils/criteriaUtils.ts`, `utils/tabUtils.ts`, `parseDynamicExpression` (`utils/index.ts`).

## Mocked-backend layer

The browser never calls the ERP directly: every request goes to the Next.js API routes (`/api/**`). Mocked specs
answer those requests from recordings, so the real UI runs in a real browser without an ERP.

- **Record**: `pnpm pw:record` runs the mocked specs against a running backend (`PW_MOCK_RECORD=1`): one HAR per
  browser context, then `scripts/sanitize-har.mjs` (no auth headers, cookies, passwords or session tokens) and
  `scripts/compact-har.mjs` (one gzipped HAR per spec, responses equal to the previous one for the same request
  dropped, and requests a reload aborted in flight dropped too: the replay would answer them with an empty body)
  into `e2e/mocked/recordings/<spec>.har.gz`. Regenerate after a change of `com.etendoerp.metadata` responses or of
  the flow a mocked spec runs, or when a merge brings UI requests the recording does not have (the `mocked` project
  reports them). Only `pnpm pw:record` writes recordings: a normal run, local or in CI, only replays the committed
  file, so a stale recording keeps failing until a new one is committed.
- **Replay** (`support/mock/`): requests are keyed by method, path, sorted query and canonical JSON body, without
  volatile values (`language`, `_noCache`, `csrfToken`, `password`, `recordTime`). Requests that only report what
  the user did (`recent-documents`, `REPORT_ONLY_PATHS`) are keyed without their body, which depends on timing.
  A key asked more times than recorded
  repeats its last response. A request with no recording gets a 404 and fails the test, except the background
  polling (alerts, process monitor).
- **Pilot**: `mocked/NAVaMockedTest` runs the NAVa flow (`support/flows/navigation.ts`, shared with the real spec).

| Pilot measure | Value |
|---|---|
| Runtime | 16.4 s (real NAVa ~20 s); ×5 in 42.7 s with 3 workers |
| Without an ERP | Passes against a UI whose ERP URL is unreachable (a real login fails there) |
| Recording | 21 s; 12 MB raw → 744 KB compacted (window metadata is most of it) |

**Classification of the specs**

| Spec | Class | Reason |
|---|---|---|
| 01-login | mockable | Page rendering and error message; keep one real login (every real spec logs in anyway). |
| ADMa, ADMb, ADMc | real backend | Create master data (ADMa logs in as the user it creates). |
| ADMd Client SR form | mockable | The bug it guards was client side (form mounted without a record). |
| ADMd tree view | mockable | Toolbar and tree rendering on recorded metadata and tree data. |
| PurchaseOrderDisplayLogic | mockable | Display logic evaluation of a new record. |
| FiltersComplete | split | Building the advanced filter is client side; that rows are filtered is server side. |
| LNKa | split | Linked-items rendering and navigation are client side; the categories come from a server handler. |
| SALa–SALd, PROa–PROe, FINb–FINe | real backend | Document processing, Classic popups, accounting, background processes. |
| crud-performance | real backend | Measures real latency. |
| rendering, stress | split | Page load, Web Vitals and 404 recovery are client side; dashboard timings and login cycles need the server. |
| PRCb | split | Grid selection and onProcess abort are client side; amounts come from the Add Payment handlers. |
| FRMa, FRMb, NAVa | mockable | Display/read-only logic and URL state on recorded metadata and records (NAVa is the pilot). |
| FRMc, SESa | real backend | Save → reload round trip; server-side session and defaults. |
| FRMe | real backend | Selector popup records and Add Payment defaults come from the datasource and the defaults handler. |
| GRDa, GRDb | split | Child tab, sort and guard are client side; callout, clone, delete and cache are server side. |
| PRCc, PRCd, FRMd, GRDc, GRDe | real backend | Report generation, Classic handler contract, attachment storage, saved views and tree moves are persisted. |
| GRDd, NAVb, NAVc | mockable | Client-side grouping, summary, shortcuts and record navigation on recorded data. |

**Recommendation.** Extend the layer only to probes of client logic (the "mockable" rows) and keep every flow that
saves, processes or depends on the session against the real backend: mocked specs complement the integration
specs, never replace them. Keep them in `playwright-automation`, where the UI is already running (~16 s per spec),
and move them to "New UI Tests" (GitHub Actions, which already builds the UI) once there are several: that job
would also need Chromium (`playwright install chromium`), the standalone server and `--project=mocked --no-deps`,
about 1–2 minutes of setup that a single spec does not pay back.

## Timing

Local full runs, test stage only (3 workers, same machine, no retries):

| Change | Run 1 | Run 2 | Run 3 | Mean |
|---|---|---|---|---|
| Before ETP-5832 (`main`) | 436 s | 412 s | 427 s | 425 s |
| `@smoke` probes (SESa excluded) | 438 s | 472 s | 448 s | 452 s (+27 s) |
| Everything: smoke probes, regression tier, mocked pilot and a drift guard (since removed) | 533 s | 532 s | 530 s | 532 s (+107 s) |

In the final runs `suite-01-base` takes ~151 s (was ~93 s); the leaf projects run side by side after
`suite-04-financial` (`suite-05-regression` ~36 s, `mocked` ~16 s); the other projects did not
change. 142 tests passed in every run, none flaky. The budget for a PR is ~2 minutes more, so the CI job still runs
everything; leaving the regression tier out of PRs would save ~36 s (see [Keeping the PR time](#keeping-the-pr-time)).

## Keeping the PR time

Apply in order, and stop as soon as the budget is met. Every pipeline change must stay backward compatible
(branches without the new files keep running the whole suite).

1. **Tiers**: PRs run `--grep-invert @regression`, pushes to develop/main run everything. It works because
   `suite-05-regression` is a leaf; a tag inside a dependency project cannot be filtered out.
2. **Change-based selection**: a versioned map of path globs to area tags, diffed against the target branch
   (clones are shallow: fetch the base first); shared code (stores, contexts, api-client, `e2e/support`) runs
   everything.
3. **Balance the projects**: split specs much longer than the rest of their project.
4. **Cache the environment**: installing the ERP costs more than the whole test stage; a prebuilt database and
   compiled ERP per core version would save more than every new spec costs (infrastructure work).

## When the Playwright check fails

| Symptom in the report | Cause | Fix |
|---|---|---|
| `support-unit` › `spec tags`: "must have exactly one tier/area tag" | A spec under `smoke/` or `regression/` misses the tags of its folder (or has two) | Put `@smoke`/`@regression` and, in a probe folder, its area tag in the `describe` title ([Tiers and tags](#tiers-and-tags)) |
| `mocked` › "requests without a recording: run pnpm pw:record" | The UI sends a request the recordings do not have: the flow of a mocked spec changed, or a new volatile value (a timestamp) is in the request | First check each listed request is intended: an unexpected one (a duplicate, a lost parameter) can be a bug that recording again would hide. A changed flow: `pnpm pw:record` and commit `e2e/mocked/recordings/<spec>.har.gz`. A volatile value: add its key to `VOLATILE_KEYS` (`support/mock/normalize.ts`). A request that only reports what the user did and whose whole body depends on timing: add its path to `REPORT_ONLY_PATHS` |

**Metadata PRs.** The CI job clones `com.etendoerp.metadata` from the branch with the same name as the UI branch, or
else from one with the same task key (then the base branch). A metadata change that alters a recorded response
does not fail any check: the mocked specs keep answering with the old response. Regenerate the recordings locally
with that metadata branch deployed (backend running, UI on `:3000`) and commit them to the UI branch of the task.

## Known issues

Found by the probes, reported for their own issues (not fixed in ETP-5832):

- **Funds Transfer**: Execute stays enabled with mandatory parameters empty (Deposit To, GL Item, Deposit Amount)
  and the backend answers "An unknown error has occurred"; Classic disables DONE. `isMandatoryParameterMissing`
  treats a parameter absent from the form values as set (`requireActualValue` mode exists but is not used there).
- **Funds Transfer**: "Multiple Rate By" is shown on open with Currency To empty: its display logic
  `@c_currency_to_id@!undefined` is true for `""`; Classic hides it.

Minor differences with Classic, not fixed:

- The first click on the column a grid is sorted by by default (Line No.) does nothing; a second click sorts.
- Escape inside a form input does not trigger the unsaved-changes guard (closing the window does).
- The breadcrumb "Go back" depends on the focused tab (from a level-0 grid it closes the window).
- The "Add Note" modal stays open, cleared, after a note is added.
- `Alt+Shift+N` does not unselect the row selected by clicking it (the current record).
- The saved views menu stays open after saving a view or changing the default.

## Production changes made for the suite

Only `data-testid` attributes, plus two application fixes found while unblocking the skipped specs:

- Test IDs: `login-submit-button`, `profile-menu-button`, `profile-save-button`, `profile-logout-button`,
  `drawer-toggle-button`, `process-modal`, `process-modal-title`, `process-modal-close-button`,
  `process-modal-execute-button[-<value>]`, `legacy-process-modal-title`, `ProcessMenuItem__<process id>` (all
  process menu entries shared one hash ID), `LinkedItem__<record id>`, `Tab__<AD_Tab_ID>`.
- `useDatasource` sends the latest params on every request. With a `refetchKey` the request body used to stay
  pinned to the first fetch, so a Pick & Execute script refetching its grid after a parameter change (Add
  Payment's Transaction Type) resent the old value. Classic P&E grids add the parameter values on every request.
- `WindowReferenceGrid` makes delivered rows its read store before notifying `dataArrived`/`onGridLoad`. A script
  that edits rows on load (Add Payment distributing an actual payment) otherwise wrote the previous rows back over
  a filtered refetch. Classic fires `dataArrived` once the grid holds the new data.

Fixes for bugs the ETP-5832 probes found (each with unit tests):

- **Datasource response cache** (`api-client/src/api/datasource.ts`, 30 s): saving or deleting never evicted it, so
  reopening a window or applying the same filter again showed deleted rows. `useDeleteRecord`, `useFormAction` and
  `saveRecord` now call `datasource.clearCacheForEntity` after a successful write, as the class comment intended.
- **Session warehouses** (`com.etendoerp.metadata`, `SessionBuilder`): warehouses and the organization tree were
  resolved for the client of the user's first role only, so a user with roles in several clients (admin: F&B, QA
  Testing, System) was offered another client's warehouses. They are resolved per client of each role.
- **"Save as default"** (profile modal): the box stayed ticked after a change that used it, so the next profile
  change was also saved as the user's default. `useSaveAsDefault` unticks it once a change is applied (Classic
  reloads the application after every profile change).

## Configuration

- Local run: new UI on `http://localhost:3000` (`PLAYWRIGHT_BASE_URL` to change it) built from the branch under
  test, Etendo Classic with the QA_Testing sample data and without extra modules (some process layouts change
  with other dependencies). Credentials `admin`/`admin`.
- Environment variables (all optional): `PLAYWRIGHT_BASE_URL` (new UI), `PLAYWRIGHT_IFRAME_URL` (Classic host),
  `PLAYWRIGHT_USER`, `PLAYWRIGHT_PASSWORD`. The former `CYPRESS_*` names are still read as fallbacks.
- CI: `com.etendoerp.jenkins.pipelines/playwright-automation/Jenkinsfile`. The static checks stage runs a script
  only when the branch's `playwright-tests/package.json` defines it, so older branches keep working.

## Differences with the former Cypress suite / Classic

- The three smoke flows skipped since the Cypress migration now run:
  - **SALa** (order → shipment → invoice → post): Classic's "Create Lines From" of a Goods Shipment needs the
    storage bin id, not only its search key; the spec sets both, as the selector popup does.
  - **PROb** (advance payment): needed the `useDatasource` fix above to list orders in Add Details.
  - **PROe** (landed cost): "Raw material A" requires a serial number. As in Classic, the order line does not ask
    for it (the product callout clears the attribute set its display logic reads) and the receipt line does, so
    the spec sets it there before completing the receipt. The sample data only schedules the "Costing Background
    process" for another client, so the spec runs it for QA Testing (reusing the request when it exists) and waits
    for a successful run in its Process Monitor before processing the Landed Cost.

## Main files

| File | Role |
|---|---|
| `playwright-tests/playwright.config.ts` | Projects, timeouts, retries, reporters |
| `playwright-tests/e2e/support/fixtures/index.ts` | `test`/`expect`, `app`/`data`/`session` fixtures |
| `playwright-tests/e2e/support/components/` | UI components |
| `playwright-tests/e2e/support/registry/` | Windows, tabs, sample data, field ids |
| `playwright-tests/scripts/check-e2e.mjs` | Ratchet (`pnpm check:e2e`) |
| `playwright-tests/reporters/flaky-summary.mjs` | Flaky test summary |
| `playwright-tests/e2e/support/tags.ts` | Tier and area tags, rules checked by `support/__tests__/tags.spec.ts` |
| `playwright-tests/e2e/support/api/ApiData.ts` | `api` fixture: records created and deleted through the datasource |
| `playwright-tests/e2e/support/processOverrides.ts`, `network.ts` | Process definition overrides in the metadata; blocked requests |
| `playwright-tests/e2e/support/flows/` | Flows shared by several specs (navigation, own records) |
| `playwright-tests/e2e/support/mock/` | Request keys, replay, mocked fixture |
| `playwright-tests/scripts/sanitize-har.mjs`, `compact-har.mjs` | Recording post-processing (`pnpm pw:record`) |
| `playwright-tests/e2e/smoke/08_Process` … `12_Session`, `e2e/regression/` | Feature probes |
| `playwright-tests/e2e/mocked/` | Mocked-backend pilot and its recordings |
| `playwright-tests/MIGRATION_REPORT.md` | Cypress migration notes and status of the formerly skipped specs (the Cypress suite was removed in ETP-5798; see the git history) |
