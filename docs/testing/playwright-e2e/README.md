# Playwright E2E suite

End-to-end tests of the new UI against a running Etendo Classic backend, in `playwright-tests/`. CI runs the whole
suite on every PR in the `playwright-automation` Jenkins job (GitHub check "Playwright Tests"), on a freshly
installed ERP with the QA_Testing sample data and no extra modules.

Conventions for writing specs (folder layout, selector and waiting policies, recipes, how to run one spec):
[playwright-tests/CLAUDE.md](../../../playwright-tests/CLAUDE.md). Test-ID rules for components:
[data-testid-check.md](../../data-testid-check.md).

_Last updated: 2026-10-19 (ETP-5798)._

## Behavior

- **Projects run in order** through `dependencies`: `support-unit` (registry/helper unit tests, no browser) →
  performance → base (login, master data, filters, linked items) → sales → procurement → financial.
- **Spec files of a project run in parallel**, up to the project's `workers` (3 for the smoke projects, 2 for
  performance; 3 is also the global limit). Each spec selects only the documents it created: SALc ships only its
  own orders in "Create Shipments from Orders" (the form lists the booked orders of every spec), SALa invoices only
  its own shipment.
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
| Parallelism inside a project, projects still in sequence; 3 workers at most | Specs of a project only touch the documents they create (they filter by their own document numbers), so they can overlap; different projects share business partners and credits. The browsers run in the same CI pod as the UI and the ERP (4 CPUs), so more workers would slow the server down and turn waits into timeouts. |
| Retries kept, flakiness made visible | Removing retries or failing on flaky tests would block PRs on infrastructure noise; the summary keeps it visible. |

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
| `playwright-tests/MIGRATION_REPORT.md` | Cypress migration notes and status of the formerly skipped specs (the Cypress suite was removed in ETP-5798; see the git history) |
