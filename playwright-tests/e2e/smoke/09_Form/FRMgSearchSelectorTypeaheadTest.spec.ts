import { expect, test } from "../../support/fixtures";
import { runAndWaitForFormInitialization } from "../../support/wait";

const BUSINESS_PARTNER = "Business Partner";
/** Search box inside the dropdown of a selector with many options. */
const OPTION_SEARCH = 'input[aria-label="Search options"]:visible';
const OPTIONS = '[data-testid^="OptionItem__"]';
const DATASOURCE = "/api/datasource";
/** Vendors of the sample data: "Vendor Germany" is one of many that contain "Vendor" in the name. */
const VENDOR_GERMANY = "Vendor Germany";
const GERMANY = "Germany";
/** Minimum characters of a search selector before it queries the server. */
const MIN_CHARS = 3;
/** The server has to be asked within this time of typing; without the search it never is. */
const SEARCH_TIMEOUT = 15_000;

/** Whether a request is a datasource call that carries `term`. */
function isSearchFor(term: string) {
  return (request: { url(): string; postData(): string | null }) =>
    request.url().includes(DATASOURCE) && (request.postData() ?? "").includes(term);
}

/**
 * Search (reference 30) selectors ask the server while the user types: the matching records are offered even when
 * they were not loaded with the dropdown, below the minimum of characters nothing is asked, and picking a
 * found record runs its callouts. The new Purchase Order is never saved.
 */
test.describe("Form - Search selector typeahead on the server @smoke @form", () => {
  test.beforeEach(async ({ app }) => {
    await app.sidebar.navigateTo("purchaseOrder");
    await app.toolbar.newRecord();
    await app.field.selector(BUSINESS_PARTNER).click();
    await expect(app.page.locator(OPTION_SEARCH)).toBeVisible();
  });

  test("offers the records that match what is typed, also the ones not loaded with the dropdown", async ({ app }) => {
    const { page } = app;
    const search = page.locator(OPTION_SEARCH);
    const initialFirstOption = await page.locator(OPTIONS).first().innerText();

    const asked = page.waitForRequest(isSearchFor(GERMANY), { timeout: SEARCH_TIMEOUT });
    await search.fill(GERMANY);
    await asked;

    const found = page.locator(OPTIONS).filter({ hasText: VENDOR_GERMANY });
    await expect(found).toBeVisible();
    await expect(page.locator(OPTIONS)).toHaveCount(1);

    // Clearing the text brings back the options of the dropdown
    await search.clear();
    await expect(page.locator(OPTIONS).first()).toHaveText(initialFirstOption);
    await expect(page.locator(OPTIONS)).not.toHaveCount(1);
  });

  test("tells how many characters it needs and asks the server from the minimum", async ({ app }) => {
    const { page } = app;
    const search = page.locator(OPTION_SEARCH);
    await expect(search).toHaveAttribute("placeholder", new RegExp(`${MIN_CHARS} characters`));

    const asked = page.waitForRequest(isSearchFor(GERMANY.slice(0, MIN_CHARS)), { timeout: SEARCH_TIMEOUT });
    await search.fill(GERMANY.slice(0, MIN_CHARS));
    await asked;
    await expect(page.locator(OPTIONS).filter({ hasText: VENDOR_GERMANY })).toBeVisible();
  });

  test("fills the field and runs its callouts when a found record is picked", async ({ app }) => {
    const { page } = app;
    // A new record has no address until the callout of the business partner fills it
    await expect(app.field.selector("Partner Address")).toHaveText(/^\s*$|Select an option/);

    await page.locator(OPTION_SEARCH).fill(GERMANY);
    const found = page.locator(OPTIONS).filter({ hasText: VENDOR_GERMANY });
    await found.first().waitFor({ state: "visible" });
    await runAndWaitForFormInitialization(page, () => found.first().click());

    await app.field.expectToContain(BUSINESS_PARTNER, VENDOR_GERMANY);
    // The callout of the business partner fills the fields that depend on it
    await expect(app.field.selector("Partner Address")).not.toHaveText(/^\s*$|Select an option/);
  });
});
