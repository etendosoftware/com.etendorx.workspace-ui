import { expect, test } from "../../support/fixtures";
import { overrideField } from "../../support/processOverrides";
import { WINDOW_IDS } from "../../support/registry/windows";

const DESCRIPTION = "description";

/**
 * A multi-line text field (reference Text) follows its read-only logic like the other field types: the user cannot
 * type in it. The bare core has no Text field with a read-only logic on the sample documents, so the spec injects
 * one into the Description of the Sales Order header: read-only only for one sample draft order. Both orders are
 * sample data and are only read.
 */
test.describe("Form - multi-line text field read-only state @smoke @form", () => {
  test("a Text field with a read-only logic is disabled only where the logic is true", async ({ app, data, page }) => {
    const lockedOrder = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    const editableOrder = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT_WITH_LINES;
    const override = await overrideField(page, WINDOW_IDS.SALES_ORDER, data.FIELD.SALES_ORDER_DESCRIPTION, {
      readOnlyLogicExpression: `OB.Utilities.getValue(currentValues,'documentNo') === '${lockedOrder}'`,
    });

    await app.sidebar.navigateTo("salesOrder");
    expect(override.applied, "the Description field was not found in the window metadata").toBeGreaterThan(0);
    await app.toolbar.disableImplicitFilter();

    await app.grid.filter("Document No.", lockedOrder);
    await app.grid.openRowForm(app.grid.rowWithCell(lockedOrder));
    await app.breadcrumb.waitFor(lockedOrder);
    await app.field.expectReadOnly(DESCRIPTION, true);
    await expect(app.field.byName(DESCRIPTION).locator("textarea")).toBeDisabled();

    // Escape leaves the form for the grid
    await page.keyboard.press("Escape");
    await app.grid.filter("Document No.", editableOrder);
    await app.grid.openRowForm(app.grid.rowWithCell(editableOrder));
    await app.breadcrumb.waitFor(editableOrder);
    await app.field.expectReadOnly(DESCRIPTION, false);
    await expect(app.field.byName(DESCRIPTION).locator("textarea")).toBeEnabled();
  });
});
