import { expect, test } from "../../support/fixtures";
import { gridFetchParams } from "../../support/wait";

/** AD_Menu_ID of "Create Invoices From Orders": a process opened from the menu, with a grid of orders to pick. */
const CREATE_INVOICES_MENU_ID = "28D5CB59D59243FAA495AABD3775C692";
const CREATE_INVOICES_PROCESS_ID = "C044DDAA929E40D780C36154FBB968F7";
const ORDERS_GRID_TAB_ID = "23F28093E8BC4E68912F6EF914CF15BE";
const CREATE_INVOICES = "Create Invoices From Orders";
/** AD_Reference_ID of "Multi Selector", the reference of a parameter that picks several records. */
const MULTI_SELECTOR_REFERENCE = "87E6CFF8F71548AFA33F181C317970B5";
/** A column of the orders grid: the multi-selector shares its name, as in the processes of the ticket. */
const SHARED_NAME = "documentNo";
const PROCESS_DEFINITION = new RegExp(`/api/erp/meta/process/${CREATE_INVOICES_PROCESS_ID}`);
const DEFAULTS_HANDLER = /DefaultsProcessActionHandler/;

/**
 * A multi-selector parameter whose name is a column of the grid (ETP-6333). The grid request must send its ids
 * as a list, as Classic does: sent as one comma separated text the server finds no record. The core has no
 * process with that shape, so the spec gives "Create Invoices From Orders" a multi-selector named as a column
 * of its grid, with two ids picked by default. Read-only: the process is not executed.
 */
test.describe("Process grid - multi-selector with a column name @smoke @process", () => {
  test("sends the ids of a multi-selector as a list", async ({ app, page }) => {
    await page.route(PROCESS_DEFINITION, async (route) => {
      const response = await route.fetch();
      const definition = await response.json();
      definition.parameters[SHARED_NAME] = {
        id: "E2E_PRCH_MULTI_SELECTOR",
        name: SHARED_NAME,
        dBColumnName: SHARED_NAME,
        reference: MULTI_SELECTOR_REFERENCE,
        mandatory: false,
        active: true,
        sequenceNumber: 5,
      };
      await route.fulfill({ response, json: definition });
    });
    await page.route(DEFAULTS_HANDLER, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.defaults = { ...body.defaults, [SHARED_NAME]: "ID-ONE,ID-TWO" };
      await route.fulfill({ response, json: body });
    });
    const gridFetch = page.waitForRequest(
      (request) => gridFetchParams(request.postDataJSON(), ORDERS_GRID_TAB_ID)?.[SHARED_NAME] !== undefined
    );

    await app.sidebar.openMenuEntry(CREATE_INVOICES, CREATE_INVOICES_MENU_ID);
    const request = await gridFetch;

    expect(gridFetchParams(request.postDataJSON(), ORDERS_GRID_TAB_ID)?.[SHARED_NAME]).toEqual(["ID-ONE", "ID-TWO"]);
  });
});
