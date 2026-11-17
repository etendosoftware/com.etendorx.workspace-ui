import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";

const BUSINESS_PARTNER = "Business Partner";
const PARTNER_ADDRESS = "Partner Address";
/** The request a form save sends: `_operationType=add` for a new record. */
const SAVE_REQUEST = /\/api\/datasource\/.*_operationType=add/;
const FORM_INITIALIZATION = /FormInitializationComponent/;
/** How long the callouts are held back, so the save is requested while they are still running. */
const CALLOUT_DELAY = 3_000;
const SAVE_TIMEOUT = 60_000;
const EMPTY_ADDRESS = /^\s*$|Select an option/;

/**
 * A save requested while the callouts are running is never lost: the interface waits for them, saves once with
 * the values they filled in, and the Save button says so meanwhile. The new Sales Order is a test record that is
 * deleted afterwards. The callouts are slowed down on purpose.
 */
test.describe("Form - save while the callouts are running @smoke @form", () => {
  let savedOrderId: string | undefined;

  test.afterEach(async ({ api }) => {
    if (savedOrderId) {
      await api.remove(DATASOURCE.SALES_ORDER, savedOrderId);
      savedOrderId = undefined;
    }
  });

  /**
   * A new Sales Order whose business partner is chosen with the callouts held back, and returns once the callout
   * has been sent. Returns the saves the page sends, so a test can count them, and keeps the id of the saved order
   * for the clean-up.
   */
  async function chooseBusinessPartnerWithSlowCallouts(
    app: import("../../support/components").App,
    partnerId: string
  ): Promise<{ saves: string[] }> {
    const { page } = app;
    const saves: string[] = [];
    page.on("request", (request) => {
      if (SAVE_REQUEST.test(request.url())) saves.push(request.url());
    });
    page.on("response", async (response) => {
      if (!SAVE_REQUEST.test(response.url())) return;
      const body = await response.json().catch(() => undefined);
      savedOrderId ??= body?.response?.data?.[0]?.id;
    });

    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.newRecord();
    await expect(app.field.selector(PARTNER_ADDRESS)).toHaveText(EMPTY_ADDRESS);

    // From here every callout answers late
    await page.route(FORM_INITIALIZATION, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, CALLOUT_DELAY));
      await route.continue();
    });
    // The callout of the business partner is out and answers late: the save is requested while it runs
    const calloutStarted = page.waitForRequest(FORM_INITIALIZATION);
    await app.field.selectById(BUSINESS_PARTNER, partnerId);
    await calloutStarted;
    return { saves };
  }

  test("Ctrl+S right after choosing the business partner saves once, with the values of the callouts", async ({
    app,
    data,
  }) => {
    const { saves } = await chooseBusinessPartnerWithSlowCallouts(app, data.BUSINESS_PARTNER.CUSTOMER_A.id);
    // The callouts have not answered yet: the address they fill in is still empty
    await expect(app.field.selector(PARTNER_ADDRESS)).toHaveText(EMPTY_ADDRESS);

    await app.page.keyboard.press("Control+s");

    // The record ends up saved, with what the callouts filled in, and it was saved once
    await app.breadcrumb.documentNumber();
    await expect(app.field.selector(PARTNER_ADDRESS)).not.toHaveText(EMPTY_ADDRESS, { timeout: SAVE_TIMEOUT });
    expect(saves).toHaveLength(1);
  });

  test("pressing Ctrl+S several times while it waits saves only once", async ({ app, data }) => {
    const { saves } = await chooseBusinessPartnerWithSlowCallouts(app, data.BUSINESS_PARTNER.CUSTOMER_A.id);

    for (let press = 0; press < 3; press++) {
      await app.page.keyboard.press("Control+s");
    }

    await app.breadcrumb.documentNumber();
    expect(saves).toHaveLength(1);
  });

  test("the Save button is disabled and says it is saving while the save waits", async ({ app, data }) => {
    await chooseBusinessPartnerWithSlowCallouts(app, data.BUSINESS_PARTNER.CUSTOMER_A.id);
    const save = app.toolbar.button("save");

    await app.page.keyboard.press("Control+s");

    await expect(save).toBeDisabled();
    await expect(save).toContainText("Saving");

    // Once it is saved the button goes back to its normal label
    await app.breadcrumb.documentNumber();
    await expect(save).not.toContainText("Saving");
  });
});
