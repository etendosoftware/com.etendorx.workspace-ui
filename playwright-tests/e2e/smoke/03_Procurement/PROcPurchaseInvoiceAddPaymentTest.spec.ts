import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";
import { runAndWaitForResponse } from "../../support/wait";

const DEFAULTS_URL = /DefaultsProcessActionHandler/;
const VISIBLE_ROWS = "tbody tr:visible";

test.describe("Purchase Invoice with payment registration @smoke", () => {
  test("Completes a Purchase Invoice, adds payment and validates payment details", async ({ app, data, page }) => {
    // ── Step 1: Navigate to Purchase Invoice ─────────────────────────────────
    await app.sidebar.navigateTo("purchaseInvoice");

    // ── Step 2: New Purchase Invoice ─────────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(app.formSections.main).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner ────────────────────────────────────────
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.VENDOR_A.id);

    // Save header
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add Invoice Line ──────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");

    // Select Product with the keyboard: the search input overlaps the options, so a pointer
    // click does not reach React and the price stays 0.00. Fail fast if FormInit does not fire.
    await app.field.pickWithKeyboard("Product", data.PRODUCT.RAW_MATERIAL_A.id, {
      search: data.PRODUCT.RAW_MATERIAL_A.name,
      callout: true,
    });

    // Set Quantity
    await app.field.fillById(data.FIELD.PURCHASE_INVOICE_LINE_QUANTITY, "11,2");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Complete Invoice ──────────────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.waitForLegacy();
    await app.processModal.confirm();
    // Wait up to 30s for the result dialog — a missing dialog fails loudly
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // Refresh and verify Completed status. The header toolbar is found by its tab: while the
    // refresh reloads the record, its process menu is briefly gone and the Lines one comes first.
    const headerToolbar = app.toolbar.inTab(TABS.PURCHASE_INVOICE_HEADER);
    await headerToolbar.button("refresh").click();
    // The status resolves in a virtualized (off-screen) row — toBeAttached matches Cypress should("exist")
    await expect(page.getByText("Completed", { exact: true }).first()).toBeAttached({ timeout: 20_000 });

    // ── Step 6: Add Payment ───────────────────────────────────────────────────
    await runAndWaitForResponse(page, DEFAULTS_URL, () => headerToolbar.process("Add Payment"));

    // Wait for the payment dialog to load: the Action dropdown and the table rows appear once
    // the defaults are loaded
    await app.field.selector("Action Regarding Document").waitFor({ state: "visible", timeout: 30_000 });
    await page.locator("tbody tr").first().waitFor({ state: "attached", timeout: 30_000 });

    // Select action: "Process Made Payment(s)"
    await app.field.select("Action Regarding Document", data.LIST_VALUE.PROCESS_MADE_PAYMENTS.name);

    // Execute and wait for the modal to close (execution completed)
    await app.processModal.execute();
    await app.processModal.waitForClose();

    // ── Step 7: Verify Payment Plan tab ──────────────────────────────────────
    // Verify the Payment Plan grid shows a record once the payment was created.
    const paymentPlanTab = page.locator('button[title="Payment Plan"]');
    await paymentPlanTab.waitFor({ state: "visible", timeout: 15_000 });
    await paymentPlanTab.click();
    await app.toolbar.button("refresh").click();

    // Confirm at least one payment plan row is visible (Lines table rows are hidden while Payment Plan is active)
    await expect(page.locator(VISIBLE_ROWS).first()).toBeVisible({ timeout: 10_000 });
  });
});
