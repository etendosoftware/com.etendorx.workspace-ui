import { expect, test } from "../../support/fixtures";

const HIERARCHY_ICON = '[data-testid^="HierarchyIcon__"]';

test.describe("Master Data - Hierarchical Tree View @smoke", () => {
  test("Product Categories shows tree toggle and activates tree mode", async ({ app, page }) => {
    // Navigate to Product Categories — supports tree mode (category pattern)
    await app.sidebar.navigateTo("productCategory");

    // Tree toggle button appears in the toolbar for tree-capable windows
    const treeToggleBtn = app.toolbar.button("toggle-tree-view");
    await treeToggleBtn.waitFor({ state: "visible", timeout: 15_000 });

    // Activate tree mode
    await treeToggleBtn.click();

    // At least one hierarchy icon must be visible in the table rows
    await expect(page.locator(HIERARCHY_ICON).first()).toBeVisible({ timeout: 15_000 });
  });
});
