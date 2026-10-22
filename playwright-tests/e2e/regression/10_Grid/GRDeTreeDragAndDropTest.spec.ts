import type { SavedRecord } from "../../support/api/ApiData";
import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";
import { runAndWaitForResponse } from "../../support/wait";

/** A tree move: the PUT the drop sends to the tree datasource. */
const MOVE_NODE = /\/api\/datasource\/.*_operationType=update/;
/** Vertical position of the drop inside the target row: its middle makes the node a child of it. */
const DROP_INSIDE = 0.5;
const SUCCESS_STATUS = 0;

let created: SavedRecord[] = [];

// Removed while the page is still open (child first), also when the test failed or timed out
test.afterEach(async ({ api }) => {
  for (const record of [...created].reverse()) {
    await api.remove(DATASOURCE.PRODUCT_CATEGORY, record.id);
  }
  created = [];
});

/**
 * Tree view drag and drop: a product category dropped in the middle of another one becomes its
 * child, the move is saved, and after a refresh the tree shows it under its new parent. Both
 * categories are created by the spec and removed afterwards.
 */
test.describe("Grid - tree view drag and drop @regression @grid", () => {
  test("moves a node under another one by dragging it", async ({ app, api, data, page }) => {
    const prefix = data.uniqueValue("GRDe");
    const category = (name: string, summaryLevel: boolean) =>
      api.add(DATASOURCE.PRODUCT_CATEGORY, {
        organization: data.ORGANIZATION_ID.ALL,
        searchKey: name,
        name,
        default: false,
        plannedMargin: 0,
        summaryLevel,
      });
    const parentName = `${prefix}-parent`;
    const childName = `${prefix}-child`;
    created.push(await category(parentName, true), await category(childName, false));

    await app.sidebar.navigateTo("productCategory");
    await app.toolbar.button("toggle-tree-view").click();
    const parent = page.getByRole("row").filter({ hasText: parentName });
    const child = page.getByRole("row").filter({ hasText: childName });
    await expect(parent).toBeVisible();
    await expect(child).toBeVisible();

    const box = await parent.boundingBox();
    if (!box) throw new Error("The target row is not on screen");
    const moved = await runAndWaitForResponse(page, MOVE_NODE, () =>
      child.dragTo(parent, { targetPosition: { x: box.width / 2, y: box.height * DROP_INSIDE } })
    );
    expect(((await moved.json()) as { response?: { status?: number } }).response?.status).toBe(SUCCESS_STATUS);

    // Refetched, the child only shows once its new parent is expanded
    await app.toolbar.button("refresh").click();
    await expect(child).toBeHidden();
    // The expand toggle sits in the cell of the node identifier (the actions column comes first)
    await parent.locator("td").filter({ hasText: parentName }).getByRole("button").first().click();
    await expect(child).toBeVisible();
  });
});
