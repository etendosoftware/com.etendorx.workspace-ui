import { expect, test } from "../../support/fixtures";

/** "Tables and Columns" (Application Dictionary): only the System Administrator role has it. */
const TABLES_AND_COLUMNS = { search: "tables and", menuId: "139" };
const SYSTEM_ADMINISTRATOR = "System Administrator";
const USA = { organization: "USA", warehouse: "USA warehouse" };

/**
 * Profile switch: changing organization and warehouse changes the context new records get,
 * changing role reloads the menu, and after logging out and in again the session starts from
 * the user's defaults, untouched because "Save as default" is never ticked here.
 */
test.describe("Session - role, organization and warehouse switch @smoke @session", () => {
  test("switches the profile of the session and starts from the defaults after a new login", async ({ app, data }) => {
    const defaults = { role: data.ROLE.QA_TESTING_ADMIN.name, organization: data.ORGANIZATION.SPAIN };
    const adMenuEntry = app.sidebar.menuEntry(TABLES_AND_COLUMNS.menuId);
    await app.sidebar.search(TABLES_AND_COLUMNS.search);
    await expect(adMenuEntry).toHaveCount(0);

    await app.auth.switchProfile({ organizationName: USA.organization, warehouseName: USA.warehouse });
    expect(await app.auth.currentProfile()).toEqual({ role: defaults.role, ...USA });
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.newRecord();
    await app.field.expectToContain("Organization", USA.organization);

    await app.auth.switchProfile({ roleName: SYSTEM_ADMINISTRATOR });
    await app.sidebar.search(TABLES_AND_COLUMNS.search);
    await expect(adMenuEntry).toBeVisible();

    await app.auth.logout();
    await app.auth.login();
    expect(await app.auth.currentProfile()).toMatchObject(defaults);
    await app.sidebar.search(TABLES_AND_COLUMNS.search);
    await expect(adMenuEntry).toHaveCount(0);
  });
});
