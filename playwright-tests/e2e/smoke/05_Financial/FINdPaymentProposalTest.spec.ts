import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import type { SampleRecord } from "../../support/registry/data";
import { TABS } from "../../support/registry/windows";
import { runAndWaitForDatasource } from "../../support/wait";

const DUE_DATE_OFFSET_DAYS = 120;

interface InvoiceSpec {
  vendor: SampleRecord;
  product: SampleRecord;
  quantity: string;
  /** Payment method to set on the header, when the vendor default does not apply. */
  paymentMethod?: SampleRecord;
}

/** A date `days` from today in the MM/DD/YYYY format of the date inputs. */
const inputDateInDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
};

/** Fills the header and one line of the new purchase invoice, completes it and returns its number. */
async function completeInvoice(app: App, invoice: InvoiceSpec, fieldIds: { paymentMethod: string; quantity: string }) {
  const { page } = app;
  await expect(app.formSections.main).toBeVisible({ timeout: 10_000 });
  // Wait for the business partner callout: it sets the vendor's default payment method
  await app.field.select("Business Partner", invoice.vendor.name, { search: invoice.vendor.name, callout: true });
  if (invoice.paymentMethod) {
    await app.field.pickWithKeyboardAndVerify("Payment Method", invoice.paymentMethod, {
      fieldId: fieldIds.paymentMethod,
    });
  }

  // Save header
  await app.toolbar.save();
  await app.toast.closeAll();

  // Lines tab → New Record; product with the keyboard (the search input intercepts pointer clicks)
  await app.tabs.open("Lines");
  await app.toolbar.newRecord();
  await app.field.pickWithKeyboard("Product", invoice.product.id, {
    search: invoice.product.name,
    level: "child",
  });
  await app.field.fillById(fieldIds.quantity, invoice.quantity);

  // Save line
  await app.toolbar.save("child");
  await app.toast.closeAll();

  // Complete the invoice
  await app.toolbar.process("Complete");
  await app.processModal.waitForLegacy(15_000);
  await app.processModal.confirm();
  await app.processModal.closeResult();
  await app.toast.closeAll();

  // Refresh and verify Completed
  await app.toolbar.button("refresh").click();
  await expect(page.getByText("Completed", { exact: true }).first()).toBeAttached({ timeout: 20_000 });

  return app.breadcrumb.documentNumber();
}

test.describe("Financial - Payment Proposal - Select Expected Payments @smoke", () => {
  test("Creates two Purchase Invoices, completes them, selects both in one go and generates payment", async ({
    app,
    data,
    page,
  }) => {
    const fieldIds = {
      paymentMethod: data.FIELD.PURCHASE_INVOICE_PAYMENT_METHOD,
      quantity: data.FIELD.PURCHASE_INVOICE_LINE_QUANTITY,
    };

    // ════════════════════════════════════════════════════════════════════════
    // Invoice A — Vendor A, Raw material A, qty 11.2
    // ════════════════════════════════════════════════════════════════════════
    await app.sidebar.navigateTo("purchaseInvoice");
    await app.toolbar.newRecord();
    const invoiceNumberA = await completeInvoice(
      app,
      { vendor: data.BUSINESS_PARTNER.VENDOR_A, product: data.PRODUCT.RAW_MATERIAL_A, quantity: "11,2" },
      fieldIds
    );

    // ════════════════════════════════════════════════════════════════════════
    // Invoice B — Vendor B, Raw material B, qty 10
    // ════════════════════════════════════════════════════════════════════════
    // New record from the header toolbar (form view), without re-navigating to Purchase Invoice. The toolbar
    // is the header tab's: "the first visible button" can be the child tab's while the header re-renders.
    await app.toolbar.inTab(TABS.PURCHASE_INVOICE_HEADER).newRecordInForm();
    const invoiceNumberB = await completeInvoice(
      app,
      {
        vendor: data.BUSINESS_PARTNER.VENDOR_B,
        product: data.PRODUCT.RAW_MATERIAL_B,
        quantity: "10",
        paymentMethod: data.PAYMENT_METHOD.SPAIN_1,
      },
      fieldIds
    );

    // ════════════════════════════════════════════════════════════════════════
    // Payment Proposal — select both invoices and generate payment
    // ════════════════════════════════════════════════════════════════════════
    await app.sidebar.navigateTo("paymentProposal");
    await app.toolbar.newRecord();

    // Due date: today + 120 days
    const dueDateInput = page.locator("input#duedate");
    await dueDateInput.waitFor({ state: "visible", timeout: 10_000 });
    await dueDateInput.fill(inputDateInDays(DUE_DATE_OFFSET_DAYS));

    // Save
    await app.toolbar.save();
    await app.toast.closeAll();

    // Available Process → Select Expected Payments
    await runAndWaitForDatasource(page, () => app.toolbar.process("Select Expected Payments"));

    // Wait for table rows to load — retry once if "errors.missingData" appears
    await page.locator("tbody tr").first().waitFor({ state: "attached", timeout: 30_000 });
    if (await page.getByText("errors.missingData").isVisible()) {
      const retryBtn = page.getByRole("button", { name: "Retry" });
      if (await retryBtn.isVisible()) {
        await runAndWaitForDatasource(page, () => retryBtn.click());
      }
    }

    // Filter by each invoice number in turn so its row is rendered: a shared prefix also matched the
    // pending invoices of earlier runs, and row virtualization left the invoice out of the DOM. The
    // grid keeps rows selected when the filter hides them (keepNonExistentRowsSelected).
    const invoiceDocFilter = page.locator('input[placeholder="Filter Invoice Document No...."]');
    await invoiceDocFilter.waitFor({ state: "visible", timeout: 15_000 });

    // Rows are scoped to the modal: the Purchase Invoice grid behind it shows the same numbers
    const modal = app.processModal.root;
    await runAndWaitForDatasource(page, () => invoiceDocFilter.fill(invoiceNumberA));
    await app.grid.clickRowCell(invoiceNumberA, modal);
    const rowA = modal.locator("tbody tr").filter({ hasText: invoiceNumberA }).first();
    await expect(rowA.getByRole("checkbox", { name: "Toggle select row" })).toBeChecked({ timeout: 10_000 });

    // Filter for Invoice B specifically so it is rendered and selectable
    await runAndWaitForDatasource(page, () => invoiceDocFilter.fill(invoiceNumberB));
    await app.grid.clickRowCell(invoiceNumberB, modal);
    const rowB = modal.locator("tbody tr").filter({ hasText: invoiceNumberB }).first();
    await expect(rowB.getByRole("checkbox", { name: "Toggle select row" })).toBeChecked({ timeout: 10_000 });

    // Execute and wait for the success toast
    await app.processModal.executeButton().waitFor({ state: "visible", timeout: 30_000 });
    await app.processModal.execute();
    await app.toast.expectSuccess(/.+/, 60_000);
    await app.toast.closeAll();

    // ── Generate Payments ─────────────────────────────────────────────────
    await app.toolbar.process("Generate Payments");

    // "Process Payment Proposal" dialog — its content is a legacy page with a "Process" button
    await app.processModal.clickLegacyButton(/^Process$/, 15_000);
    await app.toast.closeAll();

    // Close the result dialog
    await app.processModal.closeResult();

    // ── Verify Lines tab: 2 lines (Vendor A and Vendor B) ────────────────
    await app.tabs.open("Lines");

    // Wait for at least 2 rows (the grid may virtualize them — use attached)
    await page.locator("tbody tr").first().waitFor({ state: "attached", timeout: 30_000 });
    await page.locator("tbody tr").nth(1).waitFor({ state: "attached", timeout: 10_000 });

    await expect(page.locator('td[title="Vendor A"] button').first()).toBeAttached({ timeout: 10_000 });
    await expect(page.locator('td[title="Vendor B"] button').first()).toBeAttached({ timeout: 10_000 });
  });
});
