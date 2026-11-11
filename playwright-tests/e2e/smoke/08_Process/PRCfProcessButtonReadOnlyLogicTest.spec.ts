import { expect, test } from "../../support/fixtures";
import { overrideField } from "../../support/processOverrides";
import { WINDOW_IDS } from "../../support/registry/windows";

const ADD_PAYMENT = "Add Payment";
const ARIA_DISABLED = "aria-disabled";

/**
 * Read-only logic of a process button, as Classic's `readOnlyIf`: the entry stays in the process menu but
 * disabled. The bare core has no button that can be shown read-only, so the spec injects one into the
 * "Add Payment" button of the Sales Invoice header. It reads a real auxiliary input of the record
 * (DOCBASETYPE, served by the FormInitialization) and the document number: true only for I/25. Read-only:
 * nothing is ever run.
 */
test.describe("Process button read-only logic - disabled entry and selection @smoke @process", () => {
  test("disables the entry while the logic is true for any selected record", async ({ app, page, data }) => {
    const disabledInvoice = data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING;
    const enabledInvoice = data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING_CUSTOMER_B;
    const override = await overrideField(page, WINDOW_IDS.SALES_INVOICE, data.FIELD.SALES_INVOICE_ADD_PAYMENT, {
      readOnlyLogicExpression: `context.DOCBASETYPE === 'ARI' && OB.Utilities.getValue(currentValues,'documentNo') === '${disabledInvoice}'`,
    });

    await app.sidebar.navigateTo("salesInvoice");
    expect(override.applied, "the Add Payment field was not found in the window metadata").toBeGreaterThan(0);
    // Both invoices are completed: the implicit filter shows drafts only
    await app.toolbar.disableImplicitFilter();
    // Exactly the two sample invoices: other specs create I/2xx numbers
    await app.grid.filter("Document No.", `==${disabledInvoice} or ==${enabledInvoice}`);
    const disabledRow = app.grid.rowWithCell(disabledInvoice);
    const enabledRow = app.grid.rowWithCell(enabledInvoice);
    const addPayment = app.toolbar.processEntry(ADD_PAYMENT);

    // A record whose logic is false: the entry is enabled
    await app.grid.setRowSelected(enabledRow, true);
    await app.toolbar.openProcessMenu();
    await expect(addPayment).toHaveAttribute(ARIA_DISABLED, "false");
    await page.keyboard.press("Escape");

    // The logic is true only once the record's auxiliary input arrived: shown but disabled
    await app.grid.setRowSelected(enabledRow, false);
    await app.grid.setRowSelected(disabledRow, true);
    await app.toolbar.openProcessMenu();
    await expect(addPayment, "the read-only logic did not disable the entry").toHaveAttribute(ARIA_DISABLED, "true");
    await page.keyboard.press("Escape");

    // Several records (Add Payment is multi-record): disabled while the logic is true for any of them
    await app.grid.setRowSelected(enabledRow, true);
    await app.toolbar.openProcessMenu();
    await expect(addPayment, "one read-only record must disable the entry").toHaveAttribute(ARIA_DISABLED, "true");
    await page.keyboard.press("Escape");

    await app.grid.setRowSelected(disabledRow, false);
    await app.toolbar.openProcessMenu();
    await expect(addPayment).toHaveAttribute(ARIA_DISABLED, "false");
    await page.keyboard.press("Escape");
  });
});
