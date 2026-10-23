import { expect, LOGIN_ONLY, test } from "../../support/fixtures";

test.describe("Sales Order - Display logic and field visibility @smoke", () => {
  test.use({ session: LOGIN_ONLY });

  test("Displays required fields and hides delivery notes according to display logic", async ({ app }) => {
    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    await app.sidebar.navigateTo("salesOrder");

    // ── Step 2: New Record ────────────────────────────────────────────────────
    await app.toolbar.newRecord();

    // ── Step 3: Assert required fields are visible ────────────────────────────
    await expect(app.field.label("Organization")).toBeVisible({ timeout: 10_000 });
    await expect(app.field.label("Transaction Document")).toBeVisible({ timeout: 10_000 });
    await expect(app.field.label("Document No.")).toBeVisible({ timeout: 10_000 });

    // ── Step 4: Assert Delivery Notes field is hidden per display logic ────────
    await expect(app.field.container("Delivery Notes")).not.toBeAttached();
  });
});
