import { expect, test } from "../../support/fixtures";

const BOM_PRODUCT = "BOM Product";
const POST_REQUISITION = "Post Requisition";
/** Dropdown portal of the product selector, left open when the callout is slow. */
const PRODUCT_DROPDOWN = '[data-dropdown-portal="dropdown-product"]';

/** Today in the MM/DD/YYYY format of the date inputs. */
const todayAsInputDate = (): string => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

test.describe("Requisition flow - Create and generate Purchase Order @smoke", () => {
  test("Processes a requisition and creates a Purchase Order from Manage Requisitions", async ({ app, data, page }) => {
    // ── Step 1: Navigate to Requisition ──────────────────────────────────────
    await app.sidebar.navigateTo("requisition");

    // ── Step 2: New Requisition ───────────────────────────────────────────────
    await app.toolbar.newRecord();
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.EMPLOYEE_A.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 3: Add Requisition Line ──────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");

    // Select Product (BOM Product via search); selecting it fires a FormInitialization callout
    await app.field.select("Product", BOM_PRODUCT, { search: BOM_PRODUCT, exact: false, callout: true });
    // The dropdown portal can stay open when the callout is slow: dismiss it before the next field
    const productDropdown = page.locator(PRODUCT_DROPDOWN);
    if (await productDropdown.isVisible()) {
      await page.keyboard.press("Escape");
      await expect(productDropdown).toBeHidden({ timeout: 5_000 });
    }

    // Set Business Partner on line (Vendor A): the header BP is read-only once saved
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.VENDOR_A.id, { level: "child" });

    // Set Need By Date to today
    const today = todayAsInputDate();
    const needByDateInput = page.locator("#needByDate");
    await needByDateInput.scrollIntoViewIfNeeded();
    await needByDateInput.fill(today);
    await needByDateInput.blur();
    await expect(needByDateInput).toHaveValue(today, { timeout: 5_000 });

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 4: Post Requisition ──────────────────────────────────────────────
    // First open: preview the process modal title, then close without executing
    await app.toolbar.process("Complete");
    await expect(app.processModal.legacyTitle).toHaveText(POST_REQUISITION, { timeout: 10_000 });
    await app.processModal.closeResult();

    // Second open: actually execute
    await app.toolbar.process("Complete");
    await expect(app.processModal.legacyTitle).toHaveText(POST_REQUISITION, { timeout: 10_000 });
    await app.processModal.confirm();
    await app.processModal.closeResult(10_000);
    await app.toast.closeAll();

    // ── Step 5: Capture document number ──────────────────────────────────────
    // The modal must be closed so the number is not taken from it
    await expect(app.processModal.legacyTitle).toBeHidden({ timeout: 5_000 });
    const orderNumber = await app.breadcrumb.documentNumber();

    // ── Step 6: Navigate to Manage Requisitions ───────────────────────────────
    await app.sidebar.navigateTo("manageRequisitions");

    // ── Step 7: Filter by document number and verify single result ────────────
    // Disable the implicit HQL/SQL filter (e.g. processed='N') before applying our filter
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", orderNumber);

    await expect(app.grid.row(orderNumber)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("tbody tr:visible")).toHaveCount(1, { timeout: 10_000 });
    await expect(page.getByTestId("RecordCounter-simple").filter({ visible: true }).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── Step 8: Select row and create Purchase Order ──────────────────────────
    await app.grid.selectRow(orderNumber);
    await app.toolbar.process("Create Purchase Order");
    await app.processModal.waitForLegacy();
    await app.processModal.confirm();
    await app.processModal.closeResult();
    await app.toast.closeAll();
  });
});
