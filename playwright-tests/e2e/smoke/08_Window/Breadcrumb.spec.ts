import { test } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  navigateToSalesOrder,
  filterByDocumentNo,
  openRowFormByText,
  selectRowByText
} from "../../helpers/etendo.helpers";

test.describe("Breadcrumb Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
    // Equivalent to Cypress `cy.on("uncaught:exception", () => false)`
    page.on("pageerror", () => {
      /* swallow uncaught page errors */
    });
  });

  test("Check Breadcrumb Navigation", async ({ page }) => {
    // Login to Etendo and select role, org, and warehouse
    await loginToEtendo(page);
    // await selectRoleOrgWarehouse(page);

    // Navigate to Sales Order
    await navigateToSalesOrder(page);

    await filterByDocumentNo(page, "50000");
    await selectRowByText(page, "50000");

    // Navigate to the "Lines" section and select
    await page.getByRole("button", { name: "Lines" }).click();

    //   // TODO: select the record on the lines
    //   await page.getByRole('row', { name: 'Toggle select row Row actions 10 Navigate to referenced window Navigate to' }).getByRole('checkbox').check();

    //   // Navigate to the "Line Tax" section
    //   await page.getByRole("button", { name: "Line Tax" }).click();

    //   // TODO: Select the record on the line tax
    //   await page
    //     .getByRole("row", { name: "Toggle select row Row actions 10 Navigate to referenced window 30 0 07/04/2013" })
    //     .getByRole("checkbox")
    //     .check();

    await page.waitForTimeout(5000);
  });
});
