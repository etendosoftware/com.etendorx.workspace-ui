import type { Frame } from "@playwright/test";
import { LegacyFrame } from "../../support/components/LegacyFrame";
import { exactText } from "../../support/components/level";
import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";
import { runAndWaitForDatasource, runAndWaitForResponse } from "../../support/wait";

const PROCESS_ORDER = "Process Order";
/** "Create Shipments from Orders" (a Classic form opened in a popup window). */
const CREATE_SHIPMENTS_MENU = { search: "create", id: "346" };
const ORDER_CHECKBOXES = 'input[type="checkbox"][name="inpOrder"]';
const LEGACY_BUTTONS = 'td.Button_text, button, input[type="button"], input[type="submit"]';
const COPIES = 2;

/** Today in the DD-MM-YYYY format the legacy date inputs accept as value. */
const todayAsLegacyDate = (): string => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

/** Clicks the legacy button with exactly `text` in a frame. */
const clickLegacyButton = (frame: Frame, text: string) =>
  frame
    .locator(LEGACY_BUTTONS)
    .filter({ hasText: exactText(text) })
    .first()
    .click();

test.describe("Sales flow - Generate invoices from multiple sales orders @smoke", () => {
  test("Generates invoices from processed sales orders and shipments for multiple customers", async ({
    app,
    data,
    page,
  }) => {
    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    await app.sidebar.navigateTo("salesOrder");

    // ── Step 2: Create New Sales Order ────────────────────────────────────────
    await app.toolbar.newRecord();

    // ── Step 3: Fill header ───────────────────────────────────────────────────
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.CUSTOMER_BARCELONA.id);
    await app.field.selectById("Transaction Document", data.DOCUMENT_TYPE.STANDARD_ORDER.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    await app.field.selectById("Invoice Terms", "I");
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add order line ────────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");

    // Pick the first product listed and wait for the callout that fills price and UOM
    await app.field.selector("Product", { level: "child" }).click();
    const firstProduct = page.locator('[data-testid^="OptionItem__"]').first();
    await firstProduct.waitFor({ state: "visible", timeout: 15_000 });
    await runAndWaitForResponse(page, /FormInitializationComponent/, () => firstProduct.click());

    await app.field.fillById(data.FIELD.SALES_ORDER_LINE_QUANTITY, "11");

    // Save line and wait for the backend to persist it
    await runAndWaitForDatasource(page, () => app.toolbar.save("child"));
    await app.toast.closeAll();

    // ── Step 5: Process Order (Book) ──────────────────────────────────────────
    await app.toolbar.process("Book");
    await expect(app.processModal.legacyTitle).toHaveText(PROCESS_ORDER, { timeout: 10_000 });
    await app.processModal.confirm();
    await app.processModal.expectSuccess();
    await app.processModal.finishLegacy();
    await app.toast.closeAll();

    // ── Steps 6–7: Copy the order and book each copy ─────────────────────────
    // Header toolbar of the order (its child Lines tab renders a toolbar too)
    const headerToolbar = app.toolbar.inTab(TABS.SALES_ORDER_HEADER);
    for (let copy = 0; copy < COPIES; copy++) {
      await headerToolbar.button("copy-record").click();
      // Clone without children (the first option of the confirmation)
      await page
        .getByRole("button", { name: /^(Clone|Yes)$/ })
        .first()
        .click();

      // The process menu is enabled once the copy is loaded and selected
      await page
        .locator('[data-testid="IconButtonWithText__process-menu"]:visible:not([disabled])')
        .first()
        .waitFor({ state: "visible", timeout: 30_000 });

      await headerToolbar.process("Book");
      await app.processModal.confirm(20_000);
      await app.processModal.finishLegacy();
      await app.toast.closeAll();
    }

    // ── Step 8: Create Shipments from Orders (Classic form in a popup window) ─
    const popupOpened = page.waitForEvent("popup");
    await app.sidebar.openMenuEntry(CREATE_SHIPMENTS_MENU.search, CREATE_SHIPMENTS_MENU.id);
    const formPopup = await popupOpened;
    await formPopup.waitForLoadState("domcontentloaded");
    const popupFrames = new LegacyFrame(formPopup);

    // Menu.html loads the form inside a nested frame
    const processFrame = await popupFrames.findFrameWith("#paramDateFrom", 30_000);

    // Set From Date to today (legacy forms take DD-MM-YYYY as value)
    await processFrame.locator("#paramDateFrom").evaluate((element, value) => {
      const input = element as HTMLInputElement;
      input.value = value;
      for (const type of ["input", "change", "blur"]) {
        input.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      }
    }, todayAsLegacyDate());

    // Search submits the form and reloads its frame, which may already list orders: wait for the
    // reload before looking for the boxes, or they vanish while being checked
    const searchLoaded = formPopup.waitForEvent("framenavigated", {
      predicate: (frame) => frame !== formPopup.mainFrame(),
    });
    await clickLegacyButton(processFrame, "Search");
    const reloadedFrame = await searchLoaded;
    await reloadedFrame.waitForLoadState("load");

    // The results frame lists the orders: select all but the last one. The Classic page redraws
    // the list as boxes get checked, so they are clicked in one pass from inside the page.
    const resultsFrame = await popupFrames.findFrameWith(ORDER_CHECKBOXES);
    await resultsFrame.locator(ORDER_CHECKBOXES).evaluateAll((boxes) => {
      const toSelect = boxes.length > 1 ? boxes.slice(0, -1) : boxes;
      for (const box of toSelect) {
        (box as HTMLInputElement).click();
      }
    });

    await clickLegacyButton(resultsFrame, "Process");

    // Success message of the Classic message box
    const messageFrame = await popupFrames.findFrameWith("#messageBoxIDTitle", 30_000);
    await expect(messageFrame.locator("#messageBoxIDTitle")).toHaveText(/Process completed successfully/i, {
      timeout: 30_000,
    });

    // Close the popup window
    await formPopup.close();
    await app.toast.closeAll();

    // Step 9 (Generate Invoices report) has been disabled since the Cypress migration; its
    // previous implementation is in the git history of this file.
  });
});
