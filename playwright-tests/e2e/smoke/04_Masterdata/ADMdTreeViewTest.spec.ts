import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  navigateByMenuTestId,
} from "../../helpers/etendo.helpers";

test.describe("Master Data - Hierarchical Tree View @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Product Categories shows tree toggle and activates tree mode", { timeout: 120_000 }, async ({ page }) => {
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // Navigate to Product Categories — supports tree mode (category pattern)
    await navigateByMenuTestId(page, "produc", "MenuTitle__130");

    // Tree toggle button appears in the toolbar for tree-capable windows
    const treeToggleBtn = page.locator("button.toolbar-button-toggle-tree-view").first();
    await treeToggleBtn.waitFor({ state: "visible", timeout: 15_000 });

    // Activate tree mode
    await treeToggleBtn.click();

    // Tree search input is rendered only when tree mode is active
    const treeSearchInput = page.locator('[data-testid="TreeSearchInput__8ca888"]');
    await expect(treeSearchInput).toBeVisible({ timeout: 10_000 });

    // At least one hierarchy icon must be visible in the table rows
    const hierarchyIcon = page.locator('[data-testid="HierarchyIcon__8ca888"]').first();
    await expect(hierarchyIcon).toBeVisible({ timeout: 15_000 });
  });
});
