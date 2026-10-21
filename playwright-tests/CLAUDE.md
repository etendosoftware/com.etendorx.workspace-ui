# Playwright E2E suite — conventions

End-to-end tests of the new UI against a running Etendo Classic backend. CI runs them on every PR in the
`playwright-automation` Jenkins job (GitHub check "Playwright Tests"). Feature documentation:
[docs/testing/playwright-e2e/README.md](../docs/testing/playwright-e2e/README.md).

## Layout

```
playwright-tests/
  playwright.config.ts        projects (run in order through dependencies), timeouts, retries, reporters
  e2e/
    smoke/<NN_Area>/*.spec.ts  business flows (01–07) and feature probes (08_Process … 12_Session), tagged @smoke
    regression/<NN_Area>/      slower or rarer feature probes, tagged @regression (leaf project suite-05-regression)
    mocked/                    specs on recorded /api responses (no ERP) and their recordings/<spec>.har.gz
    drift/                     drift guard: the recordings must still match the real backend
    performance/*.spec.ts      timing budgets (warning/failure thresholds)
    support/                   everything specs reuse — never write selectors in a spec if a piece exists here
      fixtures/index.ts        `test` / `expect` to import; `app`, `data`, `session` fixtures
      components/              one class per reusable UI piece (Sidebar, Toolbar, FormField, Grid, ProcessModal,
                               AttributeSelector…)
      registry/windows.ts      how to open every window from the sidebar
      registry/data.ts         named sample data (business partners, products, field ids…) and uniqueValue()
      registry/datasources.ts  entity, window and tab of what the `api` fixture writes
      api/ApiData.ts           `api` fixture: create/delete records through the datasource
      flows/                   flows shared by several specs (navigation state, own categories)
      mock/                    mocked-backend layer: request keys, replay, JSON shapes, drift, its fixture
      processOverrides.ts      override a process definition in the metadata the UI loads
      network.ts               block a request and record that it was attempted
      tags.ts                  tier and area tags
      wait.ts                  network/UI waits (FormInitialization, datasource, overlay)
      __tests__/               unit tests of the registries and pure helpers (project support-unit)
  scripts/check-e2e.mjs        convention ratchet (pnpm check:e2e)
  scripts/sanitize-har.mjs     strips credentials from recordings; compact-har.mjs merges and gzips them
  reporters/flaky-summary.mjs  lists tests that passed only after a retry
  e2e-ratchet.baseline.json    committed counts of the ratchet rules
```

## Writing a spec

```ts
import { expect, test } from "../../support/fixtures";

test.describe("Purchase Order - Book @smoke", () => {
  test("books a purchase order", async ({ app, data }) => {
    await app.sidebar.navigateTo("purchaseOrder");
    await app.toolbar.newRecord();
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.VENDOR_A.id);
    await app.toolbar.save();
    await app.toast.closeAll();
    // …
  });
});
```

- Import `test` and `expect` from `support/fixtures`, never from `@playwright/test` (support unit tests excepted).
- `app` is already logged in with role "QA Testing Admin" and organization "Spain". Use
  `test.use({ session: LOGIN_ONLY })` to keep the user's default role, `NO_SESSION` to start logged out.
- Every spec under `smoke/` has `@smoke` in its `describe` title, every spec under `regression/` `@regression`. A
  feature probe (folders `08_Process`, `09_Form`, `10_Grid`, `11_Navigation`, `12_Session`) also has its area tag:
  `@process`, `@form`, `@grid`, `@nav`, `@session`. `support/__tests__/tags.spec.ts` checks it.
- A feature probe opens one window and checks several behaviors of one area in 10–30 s, without a document flow.
  Read-only probes and probes on their own records go to `suite-01-base` (add the folder to its `testMatch`).
- Data a spec needs but does not test (lines, categories, preferences) comes from the `api` fixture, not the UI.
- Never change the user's defaults or global configuration: no "Save as default"; a preference a spec needs is
  created for the user and the window only and removed in `test.afterEach` (it still runs, with the page open,
  when the test timed out — a `finally` does not).
- Do not pass `{ timeout }` as test details (Playwright ignores it); the project timeout applies, or call
  `test.setTimeout()` inside the test.
- Records the test creates get keys from `data.uniqueValue("base")`: the local database is reused and
  `--repeat-each` runs a spec several times. Sample records (vendors, products…) come from `data.*`.
- Never remove or weaken an assertion when migrating a spec; change only the interactions.
- Specs of the same project run in parallel (the project's `workers` in `playwright.config.ts`): select and process
  only records the spec created — filter by its own document number, never "the first row" or "all rows" (SALc
  checks only its own orders in "Create Shipments from Orders", SALa filters "Create Lines From Shipment" by its
  shipment). A spec that must process every pending document goes in a project with `workers: 1`. Which project
  a spec belongs to and why there are 3 workers:
  [Grouping and parallelism](../docs/testing/playwright-e2e/README.md#grouping-and-parallelism).

## Selector policy

In priority order:

1. Role or accessible label: `getByRole("button", { name: "Linked Items" })`, `input[aria-label="Name"]`,
   `app.field.fill("Name", …)`.
2. Stable domain test ID: `data-testid` built from an AD id or a fixed name, e.g. `MenuTitle__<AD_Menu_ID>`,
   `TextInput__<AD_Field_ID>`, `OptionItem__<record id>`, `ProcessMenuItem__<process id>`,
   `LinkedItem__<record id>`, `drawer-toggle-button`, `process-modal-title`, `legacy-process-modal-title`.
   Semantic toolbar classes `toolbar-button-<action>` count as such.
3. Codemod hash test IDs (`Button__602739`): forbidden — the hash is the component's file path and changes
   when the file moves.
4. CSS classes (Tailwind/MUI: `.h-14`, `.MuiChip-label`, `css-xxxxx`) and positions (`:nth-child`): forbidden.

When a control has neither a role/label nor a stable ID, add a stable `data-testid` in the component (only
the attribute, in its own commit, following [docs/data-testid-check.md](../docs/data-testid-check.md)).
Process menu entries are found by label (`app.toolbar.process("Book")`), never by position.

## Waiting policy

- Never `waitForTimeout`. Wait for the response an action triggers or for a UI state:
  `runAndWaitForFormInitialization`, `runAndWaitForDatasource`, `runAndWaitForResponse` (`support/wait.ts`),
  `locator.waitFor`, web-first `expect`.
- Never `waitForLoadState("networkidle")`: SSE connections keep the network busy.
- `app.toolbar.save()` returns once the record is saved and, for a new record, reloaded into the form: change
  fields after it, never while a save is in flight (the reload would overwrite them).
- No `force: true`: wait for the element to be actionable (dispatch a click only for overlapping toasts or
  virtualized rows, inside a component, with a comment).
- No `.catch(() => null)`: a step either must pass or is genuinely optional — then say so in the code
  (`clickLegacyButtonIfShown`) instead of hiding the failure.
- Legacy (Classic) popups: `app.processModal.confirm()` waits for the submit the OK sends. The wrapper modal's
  close button is always on screen, so closing it before the submit returns cancels the process. After a
  successful process the modal closes by itself (`finishLegacy`); clicking Close meanwhile leaves the record
  without selection.

## Recipes

**Create a header and a line**

```ts
await app.sidebar.navigateTo("salesOrder");
await app.toolbar.newRecord();
await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.CUSTOMER_BARCELONA.id);
await app.toolbar.save();
await app.toast.closeAll();
await app.tabs.open("Lines");
await app.toolbar.newRecord("child");
await app.field.pickWithKeyboard("Product", data.PRODUCT.FINAL_GOOD_A.id, {
  search: data.PRODUCT.FINAL_GOOD_A.name,
  callout: true, // waits for the FormInitialization callout (price, UOM)
  level: "child",
});
await app.field.fillById(data.FIELD.SALES_ORDER_LINE_QUANTITY, "11");
await app.toolbar.save("child");
```

**Process a document (legacy DocAction popup)**

```ts
const number = await app.breadcrumb.documentNumber();
await app.toolbar.process("Book"); // label of the menu entry
await expect(app.processModal.legacyTitle).toHaveText("Process Order");
await app.processModal.confirm(); // OK + waits for the submit
await app.processModal.expectSuccess();
await app.processModal.finishLegacy(); // the modal closes by itself after a success: do not click Close
```

Processes that do not end in a success message (Create Lines From, a Book whose result is not checked) are
closed with `app.processModal.closeResult()`.

**Run a process definition (React modal with a grid)**

```ts
await app.toolbar.process("Create Lines From Order");
await app.grid.filter("Document No.", orderNumber); // waits for the datasource
await app.grid.selectRow(orderNumber);
await app.processModal.execute();
await app.processModal.waitForClose();
```

**Use a lookup (magnifying glass)**

```ts
const lookup = app.selectorModal(data.FIELD.LANDED_COST_RECEIPT_GOODS_RECEIPT);
await lookup.open();
await lookup.search(receiptNumber);
await lookup.pick(receiptNumber);
```

**Create Lines From (legacy popup of shipments and receipts)**

```ts
await app.toolbar.process("Create Lines From");
await app.createLinesFrom.fill({ locatorValue: data.LOCATOR.L01, orderDocNumber: orderNumber });
await app.processModal.closeResult();
```

**Header and child tab on screen at once**

`level: "child"` picks the last match in DOM order, which breaks when one of the toolbars is not rendered. Scope
the toolbar to the tab instead (`Tab__<AD_Tab_ID>`, ids in `TABS`):

```ts
await app.toolbar.inTab(TABS.FINANCIAL_ACCOUNT_TRANSACTION).newRecord();
```

**Dropdown whose options re-render (right after saving a header)**

```ts
await app.field.pickWithKeyboardAndVerify("Payment Method", data.PAYMENT_METHOD.SPAIN_4, {
  fieldId: data.FIELD.PURCHASE_INVOICE_PAYMENT_METHOD,
});
```

**Set an attribute (serial number, lot) of a line**

```ts
await app.attributeSelector.open(data.FIELD.GOODS_RECEIPT_LINE_ATTRIBUTE_SET_VALUE); // AD_Field_ID of the field
await app.attributeSelector.fill(ATTRIBUTE.SERIAL_NUMBER, data.uniqueValue("SN"));
await app.attributeSelector.confirm();
await app.toolbar.save("child");
```

**Grid inside a process modal**: scope rows to `app.processModal.root` — the window grid behind the modal can show
the same document numbers.

**Create the data a probe needs (not what it tests)**

```ts
const [record] = await createCategories(api, data.uniqueValue("FRMd"), 1); // support/flows/records.ts
const preference = await api.add(DATASOURCE.PREFERENCE, { property: "OBUIAPP_GroupingEnabled", searchKey: "Y", … });
await api.remove(DATASOURCE.PREFERENCE, preference.id); // in test.afterEach
```

`api` reuses the token of the logged-in page: call it after `app` logged in. Rows by exact cell, never "the first
row": `app.grid.rowWithCell(record.name)`.

**Client behavior the bare core has no data for (a migrated onProcess)**

```ts
const override = await overrideProcessDefinition(page, WINDOW_IDS.PAYMENT_IN, data.PROCESS.ADD_PAYMENT, {
  etmetaOnprocess: `async () => ({ severity: "error", text: "Aborted" })`,
});
const payment = await blockRequests(page, /AddPaymentActionHandler/); // nothing may execute
// … open the process …
expect(override.applied).toBeGreaterThan(0);
expect(payment.sent).toBe(false);
```

Register overrides before the window opens; each test has its own context, so the metadata is never a 304. Script
answers: abort a Pick and Execute with `{ severity: "error", text }`; a message for the user is
`{ message: { msgType, msgTitle, msgText } }` (a bare `{ msgType, … }` is read as a plain success).

**A mocked spec (no ERP)**

```ts
import { test } from "../support/mock/fixture"; // same app/data/api fixtures, /api answered from recordings
test("…", async ({ app, browser, mockedBackend }) => {
  const context = await browser.newContext();
  await mockedBackend.attach(context); // another context served from the same recordings
});
```

Record it with `pnpm pw:record` against a running backend and commit `e2e/mocked/recordings/<spec>.har.gz`. Put
the flow in `support/flows/` when a real spec runs it too. A request with no recording fails the test: if the
difference is a volatile value (a timestamp), add its key to `VOLATILE_KEYS` in `support/mock/normalize.ts`.

A new window goes in `registry/windows.ts` (`search`, `menuId` = AD_Menu_ID, `breadcrumb`), a new sample
record in `registry/data.ts` (look its id up in `referencedata/sampledata/QA_Testing`).

## Running

```bash
pnpm pw:run                                    # whole suite, projects in order
pnpm pw:one e2e/smoke/03_Procurement/PROa      # one spec, without the project dependencies
cd playwright-tests && pnpm exec playwright test <spec> --no-deps --repeat-each=5 --retries=0  # stability
cd playwright-tests && pnpm exec playwright test <spec> --no-deps --workers=1 --headed  # watch it in a browser
pnpm pw:typecheck                              # tsc --noEmit
pnpm check:e2e                                 # convention ratchet
pnpm test:e2e-tooling                          # unit tests of the ratchet, reporter and HAR scripts
cd playwright-tests && pnpm exec playwright test --grep-invert @regression  # leave the regression tier out
cd playwright-tests && pnpm pw:mocked          # mocked specs only, no ERP needed (UI running)
cd playwright-tests && pnpm pw:record          # regenerate the mocked recordings (backend running)
```

A red "Playwright Tests" check from a tag rule, the mocked specs or the drift guard: see
[When the Playwright check fails](../docs/testing/playwright-e2e/README.md#when-the-playwright-check-fails).

`--grep` does not filter projects other projects depend on (Playwright runs them in full): only the leaf projects
(`suite-05-regression`, `mocked`, `mock-drift`) can be left out by tag.

Locally the suite needs the new UI on `http://localhost:3000` (`PLAYWRIGHT_BASE_URL` to change it;
`PLAYWRIGHT_IFRAME_URL`, `PLAYWRIGHT_USER` and `PLAYWRIGHT_PASSWORD` also exist) built from
the branch under test, and Etendo Classic with the QA_Testing sample data and no extra modules (the layout
of some processes changes with other dependencies). CI installs that environment from scratch on every run.

## The ratchet

`pnpm check:e2e` counts `waitForTimeout`, `force: true`, swallowed `.catch(() => …)`, hash test IDs, CSS-chain
selectors and the native value setter hack across `e2e/` and fails when a count goes above
`e2e-ratchet.baseline.json`, naming the rule and the files. After removing occurrences, lock the lower counts
in with `pnpm check:e2e --update` and commit the baseline; `--update` refuses to raise a count.
