# Playwright E2E suite — conventions

End-to-end tests of the new UI against a running Etendo Classic backend. CI runs them on every PR in the
`playwright-automation` Jenkins job (GitHub check "Playwright Tests"). Feature documentation:
[docs/testing/playwright-e2e/README.md](../docs/testing/playwright-e2e/README.md).

## Layout

```
playwright-tests/
  playwright.config.ts        projects (run in order through dependencies), timeouts, retries, reporters
  e2e/
    smoke/<NN_Area>/*.spec.ts  business flows, one spec per flow, tagged @smoke
    performance/*.spec.ts      timing budgets (warning/failure thresholds)
    support/                   everything specs reuse — never write selectors in a spec if a piece exists here
      fixtures/index.ts        `test` / `expect` to import; `app`, `data`, `session` fixtures
      components/              one class per reusable UI piece (Sidebar, Toolbar, FormField, Grid, ProcessModal,
                               AttributeSelector…)
      registry/windows.ts      how to open every window from the sidebar
      registry/data.ts         named sample data (business partners, products, field ids…) and uniqueValue()
      wait.ts                  network/UI waits (FormInitialization, datasource, overlay)
      __tests__/               unit tests of the registries and pure helpers (project support-unit)
  scripts/check-e2e.mjs        convention ratchet (pnpm check:e2e)
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
- Every smoke spec has `@smoke` in its `describe` title.
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
pnpm test:e2e-tooling                          # unit tests of the ratchet and the reporter
```

Locally the suite needs the new UI on `http://localhost:3000` (`PLAYWRIGHT_BASE_URL` to change it;
`PLAYWRIGHT_IFRAME_URL`, `PLAYWRIGHT_USER` and `PLAYWRIGHT_PASSWORD` also exist) built from
the branch under test, and Etendo Classic with the QA_Testing sample data and no extra modules (the layout
of some processes changes with other dependencies). CI installs that environment from scratch on every run.

## The ratchet

`pnpm check:e2e` counts `waitForTimeout`, `force: true`, swallowed `.catch(() => …)`, hash test IDs, CSS-chain
selectors and the native value setter hack across `e2e/` and fails when a count goes above
`e2e-ratchet.baseline.json`, naming the rule and the files. After removing occurrences, lock the lower counts
in with `pnpm check:e2e --update` and commit the baseline; `--update` refuses to raise a count.
