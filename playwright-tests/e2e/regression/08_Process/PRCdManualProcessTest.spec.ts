import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import { blockRequests } from "../../support/network";
import { overrideProcessDefinition, type ProcessDefinitionOverrides } from "../../support/processOverrides";
import { PROCESS } from "../../support/registry/data";
import { WINDOW_IDS } from "../../support/registry/windows";

/** Menu entry (the button list value) and modal title (the button field) of "Open Close Periods". */
const CLOSE_PERIOD_BUTTON = "Close Period";
const OPEN_CLOSE_PERIODS = "Open Close";
const NOT_MIGRATED = "has not been migrated yet";
const RAN = "E2E manual process ran for";
/**
 * A migrated manual process: reads the selection from the view and the `OB` shim, and answers with
 * a message (`{ message: { msgType, msgTitle, msgText } }`), as the scripts migrated from Classic
 * handlers do.
 */
const MIGRATED_SCRIPT = `async (process, view) => ({
  message: {
    msgType: "success",
    msgTitle: "E2E",
    msgText: "${RAN} " + view.selectedRecords[0]._identifier + " (OB.I18N " + typeof OB.I18N.getLabel + ")",
  },
})`;
const SUCCESS_TOAST = '[data-sonner-toast][data-type="success"]';
/** The Java handler the Classic script calls: never reached, the spec checks only the client side. */
const OPEN_CLOSE_HANDLER = /OpenClosePeriodHandler/;
/** No migrated script, whatever the database holds: the bare core ships none. */
const NOT_MIGRATED_SCRIPTS: ProcessDefinitionOverrides = { etmetaOnload: null, etmetaOnprocess: null };

/**
 * Opens "Open Close Periods" for a sample period of Open/Close Period Control, with its scripts
 * replaced by `scripts`. Returns whether the handler was called, which must never happen.
 */
async function openProcessFor(app: App, period: string, scripts: ProcessDefinitionOverrides) {
  const handler = await blockRequests(app.page, OPEN_CLOSE_HANDLER);
  const override = await overrideProcessDefinition(
    app.page,
    WINDOW_IDS.PERIOD_CONTROL,
    PROCESS.OPEN_CLOSE_PERIODS,
    scripts
  );
  await app.sidebar.navigateTo("periodControl");
  await app.grid.filter("Name", period);
  await app.grid.setRowSelected(app.grid.rowWithCell(period), true);
  await app.toolbar.process(CLOSE_PERIOD_BUTTON);
  await app.processModal.expectTitle(OPEN_CLOSE_PERIODS);
  expect(override.applied, "the process definition was not found in the window metadata").toBeGreaterThan(0);
  return handler;
}

/**
 * Manual process definitions (UI pattern "Manual"): their Classic handler is client-side JS, so the
 * new UI runs only a migrated script (`em_etmeta_onprocess`) and says so when there is none. The
 * bare core has no migrated manual process: the second test injects one into the window metadata.
 * Each test gets its own browser context, so the metadata is fetched (and overridden) again.
 */
test.describe("Process - manual process definition @regression @process", () => {
  test("without a migrated script tells the user and keeps the modal open", async ({ app, data }) => {
    const handler = await openProcessFor(app, data.SAMPLE_DOCUMENT.PERIOD_JAN_2011, NOT_MIGRATED_SCRIPTS);
    await app.processModal.execute();
    await expect(app.processModal.messageBar).toContainText(NOT_MIGRATED);
    await expect(app.processModal.title).toBeVisible();
    expect(handler.sent, "the Java handler was called").toBe(false);
  });

  test("runs the migrated script with the selection and the OB shim", async ({ app, data, page }) => {
    const period = data.SAMPLE_DOCUMENT.PERIOD_JAN_2011;
    const handler = await openProcessFor(app, period, { etmetaOnload: null, etmetaOnprocess: MIGRATED_SCRIPT });

    await app.processModal.execute();
    await expect(page.locator(SUCCESS_TOAST)).toContainText(`${RAN} ${period}`);
    await expect(page.locator(SUCCESS_TOAST)).toContainText("OB.I18N function");
    expect(handler.sent, "the Java handler was called").toBe(false);
  });
});
