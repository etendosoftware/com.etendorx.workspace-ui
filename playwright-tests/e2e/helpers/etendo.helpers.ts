import { type Page, type FrameLocator, expect } from "@playwright/test";
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
 */
export async function clickOkInLegacyPopup(page: Page) {
  // ── Case 1: React modal OK button (visible in the page directly) ──────────
  const reactOk = page.getByRole("button", { name: /^OK$/i });
  if (await reactOk.isVisible()) {
    await reactOk.click();
    return;
  }

  // ── Case 2: Legacy iframe via FrameLocator (handles normal process popups) ─
  // legacyFrame() works when only one iframe matches the selector (most steps).
  // Uses ARIA role + text selectors with a proper wait for iframe content to load.
  const frame = legacyFrame(page);
  const legacySelectors = [
    "td.Button_text.Button_width",
    "td.Button_text",
    "#buttonOK",
    'button[value="OK"]',
    'input[value="OK"]',
    "button",
  ];
  for (const sel of legacySelectors) {
    const locator = frame.locator(sel).filter({ hasText: /^OK$/i });
    try {
      if (await locator.first().isVisible({ timeout: 1_000 })) {
        await locator.first().click();
        return;
      }
    } catch {}
  }

  // ── Case 2.5: frame.evaluate() across all page frames ──────────────────────
  // Handles cases where multiple iframes cause FrameLocator strict-mode violations.
  // Directly manipulates DOM in each frame — bypasses Playwright strict mode entirely.
  for (const f of page.frames()) {
    try {
      const clicked = await f.evaluate(() => {
        const candidates = document.querySelectorAll(
          "td.Button_text, td.Button_text.Button_width, #buttonOK, button[value='OK'], input[value='OK'], button"
        );
        for (const el of candidates) {
          const text =
            (el as HTMLElement).textContent?.trim() ||
            (el as HTMLInputElement).value?.trim() ||
            "";
          if (/^OK$/i.test(text) && (el as HTMLElement).offsetParent !== null) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      if (clicked) return;
    } catch {}
  }

  // ── Case 3: evaluate fallback (nested frames) ─────────────────────────────
  await page.evaluate((iframeUrlFragment) => {
    const findAndClick = (doc: Document): boolean => {
      const candidates = doc.querySelectorAll(
        "td.Button_text, #buttonOK, button[value='OK'], input[value='OK'], button"
      );
      for (const el of candidates) {
        const text = (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || "";
        if (/^OK$/i.test(text) && (el as HTMLElement).offsetParent !== null) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    };

    const outer = document.querySelector<HTMLIFrameElement>(
      `iframe[src*="${iframeUrlFragment}"], iframe[src*="meta/legacy"], iframe[src*="classic-new-mainui"]`
    );
    if (!outer?.contentDocument) return;
    if (findAndClick(outer.contentDocument)) return;
    for (const frame of outer.contentDocument.querySelectorAll("frame, iframe")) {
      try {
        const fd = (frame as HTMLIFrameElement).contentDocument;
        if (fd && findAndClick(fd)) return;
      } catch {}
    }
  }, IFRAME_URL);
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
