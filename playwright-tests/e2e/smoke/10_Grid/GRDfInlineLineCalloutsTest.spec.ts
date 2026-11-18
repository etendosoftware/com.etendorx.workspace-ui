import type { Locator, Page } from "@playwright/test";
import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";

const LINES = "Lines";
const BUSINESS_PARTNER = "Business Partner";
const DOCUMENT_NO = "Document No.";
const SAVE_ORDER = /\/api\/datasource\/.*_operationType=add/;
/** What an empty product selector shows: its placeholder, or "(None)" when the field is not mandatory. */
const SELECT_PLACEHOLDER = /Select an option|\(None\)/;
const UNIT_PRICE = "unitPrice";
const LINE_NET_AMOUNT = "lineNetAmount";
const SAVE_ROW_BUTTON = '[data-testid^="save-button-"]';
/** The message a failed callout used to show, with the name of the server class. */
const CALLOUT_FAILED = /Couldn't execute callout/;
const FINAL_GOOD_A = "Final good A";
const FINAL_GOOD_B = "Final good B";
/** A product of the purchase price list of Vendor A (Final good A is only sold). */
const RAW_MATERIAL_A = "Raw material A";
/** Price of both products in the price lists of the sample orders. */
const LIST_PRICE = "2";
const LIST_AMOUNT = "2.00";
const CHANGED_PRICE = "3";
const CHANGED_AMOUNT = "3.00";
const UOM = "Bag";
/** The invoice header shows the gross total: the 2.00 of the line plus the tax the product has (VAT 3% and charge 0.5%). */
const INVOICE_GROSS_TOTAL = "2.07";
/** A line of the posted sample invoice, which specs only read. */
const PROCESSED_LINE_PRODUCT = "Tennis ball";
const INVOICED_QUANTITY = "invoicedQuantity";
const PRODUCT_COLUMN = "product";

type Target = typeof DATASOURCE.SALES_ORDER | typeof DATASOURCE.PURCHASE_ORDER | typeof DATASOURCE.SALES_INVOICE;

const DOCUMENT_TARGETS = {
  salesOrder: DATASOURCE.SALES_ORDER,
  purchaseOrder: DATASOURCE.PURCHASE_ORDER,
  salesInvoice: DATASOURCE.SALES_INVOICE,
} as const;

/**
 * Document lines edited in the grid: the callouts of a cell fill in and recalculate the other cells, the cells show
 * the values, and the row can be saved. Each test creates its own order and deletes it afterwards, lines included.
 */
test.describe("Grid - callouts in the inline editing of document lines @smoke @grid", () => {
  let created: { target: Target; id: string } | undefined;

  test.afterEach(async ({ api }) => {
    if (created) {
      await api.remove(created.target, created.id);
      created = undefined;
    }
  });

  /**
   * A saved draft order of the window whose Lines tab is shown under the grid of the header, with the order selected.
   * Returns the document number of the order.
   */
  async function openOrderLines(
    app: App,
    page: Page,
    window: keyof typeof DOCUMENT_TARGETS,
    partnerId: string
  ): Promise<string> {
    const target = DOCUMENT_TARGETS[window];
    page.on("response", async (response) => {
      if (!SAVE_ORDER.test(response.url()) || response.request().method() !== "POST" || !response.ok()) return;
      const id = (await response.json())?.response?.data?.[0]?.id;
      if (id && !created) created = { target, id };
    });
    await app.sidebar.navigateTo(window);
    await app.toolbar.newRecord();
    await app.field.selectById(BUSINESS_PARTNER, partnerId);
    await page.keyboard.press("Control+s");
    await app.breadcrumb.documentNumber();
    // The number of the saved document as the field shows it ("I/390" for an invoice), not the placeholder of a new one
    await expect(app.field.input(DOCUMENT_NO)).not.toHaveValue(/^</);
    const documentNo = await app.field.input(DOCUMENT_NO).inputValue();
    await app.toolbar.closeRecord();
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter(DOCUMENT_NO, documentNo);
    await app.grid.setRowSelected(app.grid.rowWithCell(documentNo), true);
    await app.tabs.open(LINES);
    return documentNo;
  }

  /** Chooses a product in the selector of the row being edited. */
  async function chooseProduct(page: Page, row: Locator, product: string): Promise<void> {
    await row.getByText(SELECT_PLACEHOLDER).or(row.getByText(FINAL_GOOD_A)).first().click();
    await page.keyboard.type(product);
    await page.getByRole("option", { name: product }).first().click();
  }

  /** What a callout leaves in the numeric cells of the row being edited. */
  const cell = (app: App, row: Locator, column: string) => app.grid.cellEditor(row, column);

  async function expectProductValues(app: App, row: Locator): Promise<void> {
    await expect(cell(app, row, UNIT_PRICE)).toHaveValue(LIST_PRICE);
    await expect(cell(app, row, LINE_NET_AMOUNT)).toHaveValue(LIST_PRICE);
    await expect(row.getByText(UOM)).toBeVisible();
    await expect(row.page().getByText(CALLOUT_FAILED)).toBeHidden();
  }

  /** The grid row of the saved line, once the edit is over. */
  const savedLine = (app: App, product: string) => app.grid.rows().filter({ hasText: product }).first();

  async function expectHeaderTotal(app: App, documentNo: string, total: string): Promise<void> {
    await expect.poll(async () => app.grid.cellTexts(app.grid.rowWithCell(documentNo))).toContain(total);
  }

  test("a new line: choosing a product fills in its price, its unit and the amount, and the line is saved", async ({
    app,
    data,
    page,
  }) => {
    const documentNo = await openOrderLines(app, page, "salesOrder", data.BUSINESS_PARTNER.CUSTOMER_A.id);
    const row = await app.grid.insertRowInEmptyGrid();

    await chooseProduct(page, row, FINAL_GOOD_A);

    await expectProductValues(app, row);
    await row.locator(SAVE_ROW_BUTTON).click();
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);
    await expect
      .poll(() => app.grid.cellTexts(savedLine(app, FINAL_GOOD_A)))
      .toEqual(expect.arrayContaining([FINAL_GOOD_A, UOM, LIST_AMOUNT]));
    await expectHeaderTotal(app, documentNo, LIST_AMOUNT);
  });

  test("a saved line: changing the price recalculates the amount on screen and the line is saved", async ({
    app,
    data,
    page,
  }) => {
    const documentNo = await openOrderLines(app, page, "salesOrder", data.BUSINESS_PARTNER.CUSTOMER_A.id);
    const row = await app.grid.insertRowInEmptyGrid();
    await chooseProduct(page, row, FINAL_GOOD_A);
    await row.locator(SAVE_ROW_BUTTON).click();
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);
    await expectHeaderTotal(app, documentNo, LIST_AMOUNT);

    const editing = await app.grid.editRow(savedLine(app, FINAL_GOOD_A));
    const price = cell(app, editing, UNIT_PRICE);
    await price.fill(CHANGED_PRICE);
    // Tab moves the focus to the next cell: the callout answers while it has it, and the cell must still show it
    await price.press("Tab");

    // The price is above the list price: the discount the callout sets is negative, which is a valid line
    await expect(cell(app, editing, LINE_NET_AMOUNT)).toHaveValue(CHANGED_PRICE);
    await expect(editing.locator(SAVE_ROW_BUTTON)).toBeEnabled();
    await editing.locator(SAVE_ROW_BUTTON).click();
    await expect
      .poll(() => app.grid.cellTexts(savedLine(app, FINAL_GOOD_A)))
      .toEqual(expect.arrayContaining([CHANGED_AMOUNT]));
    await expectHeaderTotal(app, documentNo, CHANGED_AMOUNT);
  });

  test("a saved line: changing the product fills in the price of the new one and the line is saved", async ({
    app,
    data,
    page,
  }) => {
    const documentNo = await openOrderLines(app, page, "salesOrder", data.BUSINESS_PARTNER.CUSTOMER_A.id);
    const row = await app.grid.insertRowInEmptyGrid();
    await chooseProduct(page, row, FINAL_GOOD_A);
    await row.locator(SAVE_ROW_BUTTON).click();
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);

    const editing = await app.grid.editRow(savedLine(app, FINAL_GOOD_A));
    await chooseProduct(page, editing, FINAL_GOOD_B);

    await expectProductValues(app, editing);
    await editing.locator(SAVE_ROW_BUTTON).click();
    await expect
      .poll(() => app.grid.cellTexts(savedLine(app, FINAL_GOOD_B)))
      .toEqual(expect.arrayContaining([FINAL_GOOD_B, LIST_AMOUNT]));
    await expectHeaderTotal(app, documentNo, LIST_AMOUNT);
  });

  test("a new line of a purchase order: choosing a product fills in its price and its unit", async ({
    app,
    data,
    page,
  }) => {
    await openOrderLines(app, page, "purchaseOrder", data.BUSINESS_PARTNER.VENDOR_A.id);
    const row = await app.grid.insertRowInEmptyGrid();

    await chooseProduct(page, row, RAW_MATERIAL_A);

    await expect(cell(app, row, UNIT_PRICE)).not.toHaveValue("");
    await expect(cell(app, row, LINE_NET_AMOUNT)).not.toHaveValue("");
    await expect(page.getByText(CALLOUT_FAILED)).toBeHidden();
    await row.locator(SAVE_ROW_BUTTON).click();
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);
  });

  test("a new line of a sales invoice: its product can be chosen and fills in the price and the amount", async ({
    app,
    data,
    page,
  }) => {
    // The product of an invoice line is shown only when the line is not a financial one: that rule names a column
    // of the line, and the grid must resolve it like the form view, or the selector stays disabled
    const documentNo = await openOrderLines(app, page, "salesInvoice", data.BUSINESS_PARTNER.CUSTOMER_A.id);
    const row = await app.grid.insertRowInEmptyGrid();

    await chooseProduct(page, row, FINAL_GOOD_A);

    await expect(cell(app, row, UNIT_PRICE)).toHaveValue(LIST_PRICE);
    await expect(cell(app, row, LINE_NET_AMOUNT)).toHaveValue(LIST_PRICE);
    await expect(page.getByText(CALLOUT_FAILED)).toBeHidden();
    await row.locator(SAVE_ROW_BUTTON).click();
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);
    await expect
      .poll(() => app.grid.cellTexts(savedLine(app, FINAL_GOOD_A)))
      .toEqual(expect.arrayContaining([FINAL_GOOD_A, LIST_AMOUNT]));
    await expectHeaderTotal(app, documentNo, INVOICE_GROSS_TOTAL);
  });

  test("a saved line of a sales invoice: its product can be changed and the line is saved", async ({
    app,
    data,
    page,
  }) => {
    const documentNo = await openOrderLines(app, page, "salesInvoice", data.BUSINESS_PARTNER.CUSTOMER_A.id);
    const row = await app.grid.insertRowInEmptyGrid();
    await chooseProduct(page, row, FINAL_GOOD_A);
    await row.locator(SAVE_ROW_BUTTON).click();
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);
    await expectHeaderTotal(app, documentNo, INVOICE_GROSS_TOTAL);

    // The row comes from the datasource now: the rule that shows its product must still resolve
    const editing = await app.grid.editRow(savedLine(app, FINAL_GOOD_A));
    await expect(editing.locator(`[data-column-id="${PRODUCT_COLUMN}"]`)).toHaveAttribute("tabindex", "0");
    await chooseProduct(page, editing, FINAL_GOOD_B);

    await expect(cell(app, editing, UNIT_PRICE)).toHaveValue(LIST_PRICE);
    await editing.locator(SAVE_ROW_BUTTON).click();
    await expect
      .poll(() => app.grid.cellTexts(savedLine(app, FINAL_GOOD_B)))
      .toEqual(expect.arrayContaining([FINAL_GOOD_B, LIST_AMOUNT]));
  });

  test("a line of a processed sales invoice stays read-only in the grid", async ({ app, data, page }) => {
    const processed = data.SAMPLE_DOCUMENT.SALES_INVOICE_POSTED;
    await app.sidebar.navigateTo("salesInvoice");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter(DOCUMENT_NO, processed);
    await app.grid.setRowSelected(app.grid.rowWithCell(processed), true);
    await app.tabs.open(LINES);

    const editing = await app.grid.editRow(savedLine(app, PROCESSED_LINE_PRODUCT));

    // Its read-only rule (@Processed@='Y') applies: nothing in the row can be changed, and nothing is saved
    await expect(cell(app, editing, INVOICED_QUANTITY)).toBeDisabled();
    const productCell = editing.locator(`[data-column-id="${PRODUCT_COLUMN}"]`);
    await expect(productCell).toHaveAttribute("tabindex", "-1");
    // Escape cancels the edit only from inside the grid, and nothing in a read-only row takes the focus by itself
    await productCell.focus();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid^="save-button-"]')).toHaveCount(0);
  });
});
