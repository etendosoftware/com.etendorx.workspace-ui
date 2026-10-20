import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";

const SPAIN_CASHBOOK = "Spain Cashbook";
const BP_WITHDRAWAL = { value: "BPW", name: "BP Withdrawal" };
const PAYMENT_NUMBER = /Payment No\.\s*(\d+)/;

test.describe("Financial Account - Add Transaction from Purchase Invoice @smoke", () => {
  test("Creates Purchase Invoice, completes it, verifies Payment Out Plan and adds Financial Account transaction", async ({
    app,
    data,
    page,
  }) => {
    // ── Step 1: Navigate to Purchase Invoice ─────────────────────────────────
    await app.sidebar.navigateTo("purchaseInvoice");

    // ── Step 2: Create new Purchase Invoice ──────────────────────────────────
    await app.toolbar.newRecord();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Business Partner: Vendor A
    const vendor = data.BUSINESS_PARTNER.VENDOR_A;
    await app.field.select("Business Partner", vendor.name, { search: vendor.name });

    // Save header
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 3: Change Payment Method to PM 4 Spain ───────────────────────────
    // The form may still re-render the saved record and close the dropdown: reopen it until the
    // option can be picked.
    await app.field.pickWithKeyboardAndVerify("Payment Method", data.PAYMENT_METHOD.SPAIN_4, {
      fieldId: data.FIELD.PURCHASE_INVOICE_PAYMENT_METHOD,
    });

    // Save with payment method
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add Invoice Line ──────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord();

    // Product: Raw material A, with the keyboard (the search input intercepts pointer clicks)
    const product = data.PRODUCT.RAW_MATERIAL_A;
    await app.field.pickWithKeyboard("Product", product.id, { search: product.name, callout: true, level: "child" });

    // Invoiced Quantity: 11.2
    await app.field.fillById(data.FIELD.PURCHASE_INVOICE_LINE_QUANTITY, "11,2");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // Verify Net Amount: 22.40
    // Scoped to visible elements — the Recent Documents widget on the Home page (kept
    // mounted but hidden while this window is active) can also match "22.4" once it has
    // real history, since a document's identifier text may embed the same amount.
    await expect(page.getByText("22.4").and(page.locator(":visible")).first()).toBeVisible({ timeout: 10_000 });

    // ── Step 5: Complete Purchase Invoice ─────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.waitForLegacy(15_000);
    await app.processModal.confirm();

    // Capture Payment Number from the process result
    const result = page.getByText(PAYMENT_NUMBER).first();
    await result.waitFor({ state: "visible", timeout: 30_000 });
    const resultText = (await result.textContent()) ?? "";
    const paymentMatch = resultText.match(PAYMENT_NUMBER);
    if (!paymentMatch) throw new Error(`Could not extract payment number from: "${resultText}"`);
    const paymentNumber = paymentMatch[1];

    // Close the result dialog
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // Refresh and verify Grand Total: 24.64 (visible elements only, see the note above)
    await app.toolbar.button("refresh").click();
    await expect(page.getByText("24.64").and(page.locator(":visible")).first()).toBeVisible({ timeout: 10_000 });

    // Verify Payment Complete: Yes
    await expect(page.locator('span[name="paymentComplete"]')).toHaveText("Yes", { timeout: 20_000 });

    // ── Step 6: Verify Payment Out Plan ──────────────────────────────────────
    const paymentPlanTab = page.locator('button[title="Payment Plan"]');
    await paymentPlanTab.waitFor({ state: "visible", timeout: 10_000 });
    await paymentPlanTab.click();
    await app.toolbar.button("refresh").click();

    // Verify Expected amount: 24.64 (rows are virtualized — the cell is attached but may be hidden)
    await expect(page.locator("td").filter({ hasText: "24.64" }).first()).toBeAttached({ timeout: 10_000 });

    // ── Step 7: Navigate to Financial Account ─────────────────────────────────
    await app.sidebar.navigateTo("financialAccount");

    // ── Step 8: Search and select Spain Cashbook ──────────────────────────────
    await app.grid.filter("Name", SPAIN_CASHBOOK);
    await app.grid.selectRow(SPAIN_CASHBOOK);

    // ── Step 9: Navigate to Transactions tab ──────────────────────────────────
    await app.tabs.open("Transaction");

    // ── Step 10: Add new transaction ─────────────────────────────────────────
    await app.toolbar.inTab(TABS.FINANCIAL_ACCOUNT_TRANSACTION).newRecord();

    // Transaction Type: BP Withdrawal, with the keyboard (the search input intercepts pointer clicks)
    await app.field.pickWithKeyboard("Transaction Type", BP_WITHDRAWAL.value, {
      search: BP_WITHDRAWAL.name,
      fieldId: data.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_TYPE,
    });
    // Wait for the transactionType dropdown portal to close before picking the payment
    await expect(page.locator('[data-dropdown-portal="dropdown-transactionType"]')).toBeHidden({ timeout: 10_000 });

    // Link with Payment Number from Step 5
    await app.field.select("Payment", paymentNumber, { search: paymentNumber, exact: false, level: "child" });

    // Save the transaction
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 11: Verify Payment Out status ───────────────────────────────────
    await app.sidebar.navigateTo("paymentOut");
    await app.grid.filter("Document No.", paymentNumber);

    // Click the payment record and scroll the grid to reveal the status column
    const paymentRow = await app.grid.waitForRow(paymentNumber);
    await paymentRow.click();
    await app.grid.scrollToRightEnd();

    // Verify "Payment Made" status
    await expect(page.getByText("Payment Made", { exact: true }).first()).toBeAttached({ timeout: 20_000 });
  });
});
