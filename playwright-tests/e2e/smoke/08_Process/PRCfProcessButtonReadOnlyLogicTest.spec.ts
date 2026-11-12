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

    /** Opens the process menu, checks whether "Add Payment" is disabled and closes the menu. */
    const expectAddPaymentDisabled = async (disabled: boolean, message: string) => {
      const addPayment = await app.toolbar.openProcessMenuAt(ADD_PAYMENT);
      await expect(addPayment, message).toHaveAttribute(ARIA_DISABLED, String(disabled));
      await page.keyboard.press("Escape");
    };

    await app.grid.setRowSelected(enabledRow, true);
    await expectAddPaymentDisabled(false, "a record whose logic is false disabled the entry");

    await app.grid.setRowSelected(enabledRow, false);
    await app.grid.setRowSelected(disabledRow, true);
    await expectAddPaymentDisabled(true, "the read-only logic did not disable the entry");

    // Several records (Add Payment is multi-record): disabled while the logic is true for any of them
    await app.grid.setRowSelected(enabledRow, true);
    await expectAddPaymentDisabled(true, "one read-only record must disable the entry");

    await app.grid.setRowSelected(disabledRow, false);
    await expectAddPaymentDisabled(false, "the entry stayed disabled without the read-only record");
  });

  /**
   * An auxiliary input keeps the type the server sends, as in Classic: VoidAutomaticallyCreated runs
   * `SELECT COUNT(*)` and arrives as the number 0, which `@X@=0`-style logic compares against. Reading it as
   * the string "0" (the toolbar did) hides the button in table view.
   */
  test("shows the entry whose display logic compares a numeric auxiliary input", async ({ app, page, data }) => {
    const invoice = data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING;
    const override = await overrideField(page, WINDOW_IDS.SALES_INVOICE, data.FIELD.SALES_INVOICE_ADD_PAYMENT, {
      displayLogicExpression: "context.VoidAutomaticallyCreated === 0",
    });

    await app.sidebar.navigateTo("salesInvoice");
    expect(override.applied, "the Add Payment field was not found in the window metadata").toBeGreaterThan(0);
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", `==${invoice}`);
    const row = app.grid.rowWithCell(invoice);

    // Table view: the toolbar requests the record's context itself
    await app.grid.setRowSelected(row, true);
    await expect(await app.toolbar.openProcessMenuAt(ADD_PAYMENT), "hidden in table view").toBeVisible();
    await page.keyboard.press("Escape");

    // Form view: the context comes from the form's own initialization
    await app.grid.openRowForm(row);
    await expect(await app.toolbar.openProcessMenuAt(ADD_PAYMENT), "hidden in form view").toBeVisible();
    await page.keyboard.press("Escape");
  });
});
