import {
  type A11yViolation,
  compareWithKnown,
  ENFORCED_RULES,
  formatViolations,
  scanAccessibility,
} from "../../support/a11y";
import { expect, NO_SESSION, test } from "../../support/fixtures";

/** AD_Menu_ID of "Create Invoices From Orders": a process window with a grid of orders to pick. */
const CREATE_INVOICES_MENU_ID = "28D5CB59D59243FAA495AABD3775C692";
const CREATE_INVOICES = "Create Invoices From Orders";

/**
 * Violations a screen has today, by rule, with what fixes them. The check fails on any other, and also when one
 * listed here is gone, so the list only shrinks: remove the entry when its task is done.
 */
const KNOWN: Record<"login" | "home" | "grid" | "form" | "process", Record<string, string>> = {
  login: {},
  home: {},
  grid: {
    "aria-required-children": "ETP-6305: the grid container has role=grid but the table inside it is not its child",
  },
  form: {},
  process: {},
};

/** Checks one screen against the enforced rules and reports what is new or what can leave the known list. */
async function expectNoNewViolations(
  page: Parameters<typeof scanAccessibility>[0],
  screen: keyof typeof KNOWN,
  within?: string
): Promise<A11yViolation[]> {
  const violations = await scanAccessibility(page, { rules: ENFORCED_RULES, within });
  const { unexpected, fixed } = compareWithKnown(violations, KNOWN[screen]);
  expect(unexpected, `New accessibility violations on the ${screen} screen:\n${formatViolations(unexpected)}`).toEqual(
    []
  );
  expect(fixed, `Violations of the ${screen} screen that are fixed now: remove them from KNOWN`).toEqual([]);
  return violations;
}

/**
 * Automatic accessibility check of the main screens (ETP-6304): login, home, a window with grid and form, and a
 * process window. It runs axe-core on the rendered page for the name, role and state rules, so a new screen or
 * component that breaks them fails here. Read-only: it only inspects the DOM and changes nothing.
 */
test.describe("Accessibility - main screens @smoke @a11y", () => {
  test.describe("without a session", () => {
    test.use({ session: NO_SESSION });

    test("login", async ({ page }) => {
      await page.goto("/");
      await page.locator("#username").waitFor({ state: "visible" });
      await expectNoNewViolations(page, "login");
    });
  });

  test("home", async ({ app, page }) => {
    await expect(page.getByTestId("drawer-toggle-button")).toBeVisible();
    await expectNoNewViolations(page, "home");
  });

  test("window with grid and form", async ({ app, page, data }) => {
    const order = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", `==${order}`);
    await app.grid.waitForRow(order);
    await expectNoNewViolations(page, "grid");

    await app.grid.openForm(order);
    await expect(page.getByRole("textbox").first()).toBeVisible();
    await expectNoNewViolations(page, "form");
  });

  test("process window", async ({ app, page }) => {
    await app.sidebar.openMenuEntry(CREATE_INVOICES, CREATE_INVOICES_MENU_ID);
    await expect(app.processModal.title).toBeVisible();
    await expectNoNewViolations(page, "process");
  });
});
