import { type Page, type Frame, type FrameLocator, expect } from "@playwright/test";
import { DEFAULT_USER, DEFAULT_PASSWORD, IFRAME_URL } from "../../playwright.config";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function loginToEtendo(
  page: Page,
  username = DEFAULT_USER,
  password = DEFAULT_PASSWORD
) {
  await page.goto("/");
  await page.locator("#username").waitFor({ state: "visible", timeout: 10_000 });
  await page.locator("#username").clear();
  await page.locator("#username").fill(username);
  await page.locator("#password").clear();
  await page.locator("#password").fill(password);
  await page.locator('[data-testid="Button__602739"]').first().click();
  await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });
}

export async function cleanupEtendo(page: Page) {
  await page.context().clearCookies();
  // localStorage/sessionStorage are only accessible on real pages, not about:blank
  const url = page.url();
  if (url && url !== "about:blank") {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

// ─── Role / Org / Warehouse ──────────────────────────────────────────────────

export async function selectRoleOrgWarehouse(
  page: Page,
  options: {
    roleOptionId?: string;
    organizationOptionId?: string;
    warehouseOptionId?: string;
  } = {}
) {
  const {
    roleOptionId = "#role-select-option-12",
    organizationOptionId = "#organization-select-option-3",
    warehouseOptionId = "#warehouse-select-option-1",
  } = options;

  await page.locator('[data-testid="PersonIcon__120cc9"]').click();

  // Open role dropdown
  await page
    .locator(
      ':nth-child(1) > .MuiFormControl-root > .MuiInputBase-root > [style="display: flex; align-items: center;"] > .MuiAutocomplete-endAdornment > .MuiAutocomplete-popupIndicator > [data-testid="ExpandMoreIcon"]'
    )
    .click();

  await page.locator(`${roleOptionId} > .MuiTypography-root`).click();
  await page.locator("#organization-select").click();
  await page.locator(`${organizationOptionId} > .MuiTypography-root`).click();
  await page.locator("#warehouse-select").click();
  await page.locator(`${warehouseOptionId} > .MuiTypography-root`).click();
  await page.locator(".PrivateSwitchBase-input").check();
  await page.locator(".text-\\(--color-etendo-contrast-text\\) > :nth-child(2)").click();
}

// ─── Legacy iframe helpers ───────────────────────────────────────────────────

/** Returns a FrameLocator for the main legacy iframe */
export function legacyFrame(page: Page): FrameLocator {
  // The iframe src goes through Next.js proxy at /meta/legacy OR directly to the backend host
  return page.frameLocator(
    `iframe[src*="meta/legacy"], iframe[src*="${IFRAME_URL}"], iframe[src*="classic-new-mainui"]`
  );
}

/**
 * Clicks the OK button in a process popup.
 * Handles two cases:
 *   1. React modal with a native <button>OK</button> (new-style popups)
 *   2. Legacy iframe popup with td.Button_text / #buttonOK (old-style popups)
 *
 * Uses page.frames() directly instead of FrameLocator to avoid strict-mode
 * violations when multiple iframes match the same selector.
 */
export async function clickOkInLegacyPopup(page: Page, timeout = 10_000) {
  // ── 1. React modal OK button ──────────────────────────────────────────────
  const reactOk = page.getByRole("button", { name: /^OK$/i });
  if (await reactOk.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await reactOk.click();
    return;
  }

  // ── 2. Legacy iframe — poll all frames until the OK button appears ─────────
  // page.frames() returns concrete Frame objects — no strict-mode, works cross-origin.
  // For each frame we try:
  //   a) Playwright locator (proper interactability checks, faster)
  //   b) frame.evaluate() DOM click as cross-origin fallback
  const OK_SELECTORS = [
    "td.Button_text.Button_width",
    "td.Button_text",
    "#buttonOK",
    'button[value="OK"]',
    'input[value="OK"]',
    "button",
  ] as const;
  const OK_RE = /^OK$/i;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      // 2a. Playwright locator (isVisible with timeout:0 = instant, no internal retry)
      for (const sel of OK_SELECTORS) {
        try {
          const loc = frame.locator(sel).filter({ hasText: OK_RE }).first();
          if (await loc.isVisible({ timeout: 0 })) {
            await loc.click();
            return;
          }
        } catch {
          // Frame detached or cross-origin — fall through to evaluate
        }
      }

      // 2b. DOM evaluate fallback (cross-origin frames with --disable-web-security)
      try {
        const clicked = await frame.evaluate(() => {
          const QUERY = "td.Button_text.Button_width, td.Button_text, #buttonOK, button[value='OK'], input[value='OK'], button";
          for (const el of document.querySelectorAll(QUERY)) {
            const text = (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || "";
            if (/^OK$/i.test(text) && (el as HTMLElement).offsetParent !== null) {
              (el as HTMLElement).click();
              return true;
            }
          }
          return false;
        });
        if (clicked) return;
      } catch {
        // Frame detached or cross-origin without access
      }
    }
    await page.waitForTimeout(300);
  }

  throw new Error(`clickOkInLegacyPopup: OK button not found in any frame within ${timeout}ms`);
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export async function typeInGlobalSearch(page: Page, text: string) {
  const input = page.locator('input[placeholder="Search"]').filter({ hasText: "" }).first();
  await input.waitFor({ state: "visible", timeout: 10_000 });
  await input.click({ force: true });
  await input.clear();
  await input.fill(text);
}

async function navigateSidebarTo(
  page: Page,
  searchText: string,
  menuTestId: string,
  tabName: RegExp
) {
  // The sidebar/global search input uses placeholder="Search".
  // The dynamic ID (#_r_1_, #_r_2_, ...) changes after re-renders, so use placeholder selector.
  const searchInput = page.locator('input[placeholder="Search"]').first();
  await searchInput.waitFor({ state: "visible", timeout: 10_000 });
  await searchInput.click({ force: true });
  await searchInput.clear();
  await searchInput.fill(searchText);

  await page.locator(`[data-testid="${menuTestId}"]`).waitFor({ state: "visible", timeout: 10_000 });
  await page.locator(`[data-testid="${menuTestId}"] > .flex.overflow-hidden > .relative > .ml-2`).click();
  // Window tabs in the tab strip are <button> elements, not role="tab".
  // Wait for the breadcrumb to confirm the window is active.
  await page.locator('nav[aria-label="breadcrumb"]').getByText(tabName).waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 });
}

export async function navigateToGoodsShipment(page: Page) {
  await navigateSidebarTo(page, "goods S", "MenuTitle__180", /Goods Shipment/i);
}

export async function navigateToSalesInvoice(page: Page) {
  await navigateSidebarTo(page, "sales i", "MenuTitle__178", /Sales Invoice/i);
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export async function closeToastIfPresent(page: Page) {
  // Only target toasts that are visible and NOT already removed
  const visibleToast = page.locator("[data-sonner-toast]:not([data-removed='true']) [data-close-button]");
  let attempts = 0;
  while (attempts < 5 && (await visibleToast.count()) > 0) {
    await visibleToast.first().click({ force: true }).catch(() => null);
    await page.waitForTimeout(400);
    attempts++;
  }
}

/**
 * Waits for a "Process completed successfully" message.
 * It can appear as:
 *   - A Sonner toast: [data-sonner-toast]
 *   - A message inside the legacy process modal (inside the iframe result view)
 * After detecting it, closes the modal with the "Close" button if still open.
 */
export async function expectSuccessToast(page: Page) {
  const successText = /Process completed successfully/i;

  // The success message can appear:
  //   1. In the main page (React modal renders success text directly)
  //   2. Inside the legacy iframe (when the process result page loads in the iframe)
  // Use Promise.race to detect whichever appears first.
  // Note: page.getByText() may not find text in cross-origin iframes, so we check both.
  const found = await Promise.race([
    page
      .getByText(successText)
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true)
      .catch(() => false),
    legacyFrame(page)
      .getByText(successText)
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true)
      .catch(() => false),
  ]);

  if (!found) {
    throw new Error("Process did not show 'Process completed successfully' within 30s");
  }

  // Close the process modal if it's still open
  const closeBtn = page.getByRole("button", { name: /^Close$/i });
  if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await closeBtn.click();
  }
}

// ─── Document Number ─────────────────────────────────────────────────────────

/**
 * Captures the document number (e.g. "800023") from the currently open record's header.
 * Scans visible MuiTypography-noWrap elements and returns the first one containing digits.
 */
export async function captureDocumentNumber(
  page: Page,
  selector = "p.MuiTypography-root.MuiTypography-body1.MuiTypography-noWrap"
): Promise<string> {
  await page.locator(selector).first().waitFor({ state: "visible", timeout: 20_000 });
  const elements = await page.locator(selector).all();
  for (const el of elements) {
    if (!(await el.isVisible())) continue;
    const text = (await el.textContent()) ?? "";
    const match = text.match(/(\d+)/);
    if (match) return match[1];
  }
  throw new Error("captureDocumentNumber: no visible element with a document number found");
}

// ─── Legacy CreateFrom popup ──────────────────────────────────────────────────

/**
 * Fills and submits the legacy "Create Lines From" iframe popup used in Goods Receipts.
 *
 * Flow:
 *   1. Polls page.frames() to find the frame containing #inpPurchaseOrder
 *   2. Selects the last purchase order option and triggers the change event
 *   3. Sets the storage bin (locator) description field
 *   4. Checks the last checkbox (data row)
 *   5. Clicks the OK button inside the frame
 *
 * Caller is responsible for closing the outer wrapper modal and handling toasts.
 */
export async function fillCreateLinesFromPopup(
  page: Page,
  options: { locatorValue?: string; frameTimeout?: number } = {}
): Promise<void> {
  const { locatorValue = "L01", frameTimeout = 15_000 } = options;

  // ── 1. Find the CreateFrom frame ─────────────────────────────────────────
  // page.frames() returns all frames including nested ones — no strict mode.
  let createFromFrame: Frame | null = null;
  const deadline = Date.now() + frameTimeout;
  while (Date.now() < deadline && !createFromFrame) {
    for (const f of page.frames()) {
      try {
        if ((await f.locator("#inpPurchaseOrder").count()) > 0) {
          createFromFrame = f;
          break;
        }
      } catch {
        // Frame detached or cross-origin — keep searching
      }
    }
    if (!createFromFrame) await page.waitForTimeout(500);
  }
  if (!createFromFrame) throw new Error("fillCreateLinesFromPopup: frame with #inpPurchaseOrder not found");

  // ── 2. Select last purchase order and trigger reload ──────────────────────
  const orderSelect = createFromFrame.locator("#inpPurchaseOrder");
  await orderSelect.waitFor({ state: "visible", timeout: 10_000 });
  // Wait for at least one real option (beyond the empty placeholder)
  await createFromFrame
    .locator("#inpPurchaseOrder option")
    .nth(1)
    .waitFor({ state: "attached", timeout: 15_000 })
    .catch(() => null);

  const optionCount = await orderSelect.locator("option").count();
  if (optionCount > 1) {
    await createFromFrame.evaluate(() => {
      const sel = document.getElementById("inpPurchaseOrder") as HTMLSelectElement;
      if (!sel) return;
      sel.selectedIndex = sel.options.length - 1;
      const win = sel.ownerDocument.defaultView!;
      sel.dispatchEvent(new win.Event("change", { bubbles: true, cancelable: true }));
      const w = win as unknown as Record<string, unknown>;
      if (typeof w["submitCommandForm"] === "function") {
        (w["submitCommandForm"] as (...args: unknown[]) => void)("FIND_PO", false, null, null, "_self");
      }
    });
    await page.waitForTimeout(3_000); // wait for grid to reload with lines
  }

  // ── 3. Set storage bin description ───────────────────────────────────────
  await createFromFrame.evaluate((val) => {
    const descEl = document.getElementById("paramM_Locator_ID_DES") as HTMLInputElement | null;
    if (!descEl) return;
    descEl.value = val;
    const win = descEl.ownerDocument.defaultView!;
    (["input", "change"] as const).forEach((e) =>
      descEl.dispatchEvent(new win.Event(e, { bubbles: true, cancelable: true }))
    );
    descEl.dispatchEvent(
      new win.KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true })
    );
    descEl.dispatchEvent(
      new win.KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true })
    );
  }, locatorValue);
  await page.waitForTimeout(2_000);

  // ── 4. Check the last data-row checkbox ───────────────────────────────────
  const checkboxes = createFromFrame.locator('input[type="checkbox"]');
  await checkboxes.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
  const checkCount = await checkboxes.count();
  if (checkCount > 0) {
    await checkboxes.nth(checkCount - 1).check({ force: true });
  }

  // ── 5. Click OK ───────────────────────────────────────────────────────────
  await createFromFrame
    .locator("td.Button_text")
    .filter({ hasText: /^OK$/i })
    .first()
    .click();
}

// ─── Procurement navigation ───────────────────────────────────────────────────

export async function navigateToPurchaseOrder(page: Page) {
  await navigateSidebarTo(page, "purcha", "MenuTitle__205", /Purchase Order/i);
}

export async function navigateToGoodsReceipt(page: Page) {
  await navigateSidebarTo(page, "goods r", "MenuTitle__204", /Goods Receipt/i);
}

export async function navigateToPurchaseInvoice(page: Page) {
  await navigateSidebarTo(page, "purcha", "MenuTitle__206", /Purchase Invoice/i);
}
