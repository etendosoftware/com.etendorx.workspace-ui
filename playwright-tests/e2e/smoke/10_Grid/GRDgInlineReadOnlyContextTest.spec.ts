import { expect, test } from "../../support/fixtures";
import { overrideField } from "../../support/processOverrides";
import { WINDOW_IDS } from "../../support/registry/windows";

const LINES = "Lines";
const DOCUMENT_NO = "Document No.";
const UNIT_PRICE = "unitPrice";

/**
 * The read-only logic of a cell in the inline editing of a line is evaluated with the same context as in the form:
 * besides the values of the row, the header record. The bare core has no line field whose logic reads the header, so
 * the spec injects one into the Net Unit Price of the Sales Order lines: read-only only for the lines of one sample
 * draft order. Both orders are sample data: their lines are edited without saving and the edit is cancelled.
 */
test.describe("Grid - read-only logic of line cells that reads the header @smoke @grid", () => {
  for (const { title, order, readOnly } of [
    {
      title: "a cell is read-only in the grid and in the form when the logic that reads the header is true",
      order: "SALES_ORDER_DRAFT_WITH_LINES",
      readOnly: true,
    },
    {
      title: "a cell stays editable in the grid and in the form when the logic that reads the header is false",
      order: "SALES_ORDER_DRAFT_WITH_MORE_LINES",
      readOnly: false,
    },
  ] as const) {
    test(title, async ({ app, data, page }) => {
      const document = data.SAMPLE_DOCUMENT[order];
      const lockedOrder = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT_WITH_LINES;
      const override = await overrideField(page, WINDOW_IDS.SALES_ORDER, data.FIELD.SALES_ORDER_LINE_NET_UNIT_PRICE, {
        readOnlyLogicExpression: `(currentValues["documentNo"] ?? context["documentNo"]) === '${lockedOrder}'`,
      });

      await app.sidebar.navigateTo("salesOrder");
      expect(override.applied, "the Net Unit Price field was not found in the window metadata").toBeGreaterThan(0);
      await app.toolbar.disableImplicitFilter();
      await app.grid.filter(DOCUMENT_NO, document);
      await app.grid.setRowSelected(app.grid.rowWithCell(document), true);
      await app.tabs.open(LINES);

      const line = app.grid.rows(page.locator("table").last()).nth(0);
      const editing = await app.grid.editRow(line);
      const cell = app.grid.cellEditor(editing, UNIT_PRICE);
      if (readOnly) {
        await expect(cell).toBeDisabled();
      } else {
        await expect(cell).toBeEnabled();
      }

      // Cancel the edit from inside the grid (nothing is saved), then compare with the form of the same line
      await editing.getByLabel("Toggle select row").first().focus();
      await page.keyboard.press("Escape");
      await app.grid.openRowForm(line);
      await app.field.expectReadOnly(UNIT_PRICE, readOnly);
    });
  }
});
