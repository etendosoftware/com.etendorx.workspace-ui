import { expect, test } from "../../support/fixtures";

/** "Tables and Columns" (Application Dictionary): only the System Administrator role has it. */
const TABLES_AND_COLUMNS = { search: "tables and", menuId: "139" };
const SYSTEM_ADMINISTRATOR = "System Administrator";
const USA = { organization: "USA", warehouse: "USA warehouse" };

/**
 * The organization and warehouse lists of the profile menu, in the order Classic shows them: sorted by
 * name in the browser (lowercase + localeCompare, `user-info.js.ftl`), so `F&B US, Inc.` goes after the
 * coast organizations and the accented names stay with their letter. The server sends QA Testing Admin's
 * organizations as USA, Main, *, Spain: a list in the server order fills in USA instead of *.
 */
const CLASSIC_ORDER = {
  qaTestingAdmin: {
    organizations: ["*", "Main", "Spain", "USA"],
    warehouses: ["Spain East warehouse", "Spain warehouse", "USA warehouse"],
  },
  fbInternationalGroupAdmin: {
    organizations: [
      "*",
      "F&B España - Región Norte",
      "F&B España - Región Sur",
      "F&B España, S.A",
      "F&B International Group",
      "F&B US East Coast",
      "F&B US West Coast",
      "F&B US, Inc.",
    ],
    warehouses: ["España Región Norte", "España Región Sur", "US East Coast", "US West coast"],
  },
};

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

    // A system role on an instance without purpose (a fresh database) is asked for it: closed
    await app.instancePurpose.runAndDismiss(() => app.auth.switchProfile({ roleName: SYSTEM_ADMINISTRATOR }));
    await app.sidebar.search(TABLES_AND_COLUMNS.search);
    await expect(adMenuEntry).toBeVisible();

    await app.auth.logout();
    await app.auth.login();
    expect(await app.auth.currentProfile()).toMatchObject(defaults);
    await app.sidebar.search(TABLES_AND_COLUMNS.search);
    await expect(adMenuEntry).toHaveCount(0);
  });

  test("fills in the organization and warehouse Classic fills in when the role changes", async ({ app, data }) => {
    const qaTestingAdmin = data.ROLE.QA_TESTING_ADMIN.name;
    const fbAdmin = data.ROLE.FB_INTERNATIONAL_GROUP_ADMIN.name;
    const initialProfile = await app.auth.currentProfile();

    // Another role: its first organization and that organization's first warehouse, lists in Classic order
    expect(await app.auth.previewProfile({ roleName: fbAdmin })).toEqual({
      role: fbAdmin,
      organization: "*",
      warehouse: "España Región Norte",
      ...CLASSIC_ORDER.fbInternationalGroupAdmin,
    });
    await app.auth.switchProfile({ roleName: fbAdmin });
    expect(await app.auth.currentProfile()).toEqual({
      role: fbAdmin,
      organization: "*",
      warehouse: "España Región Norte",
    });

    // Back to the first role: the Classic values, not the organization of the previous session (Spain)
    await app.auth.switchProfile({ roleName: qaTestingAdmin });
    expect(await app.auth.previewProfile({})).toEqual({
      role: qaTestingAdmin,
      organization: "*",
      warehouse: "Spain East warehouse",
      ...CLASSIC_ORDER.qaTestingAdmin,
    });

    // Only the organization: its first warehouse
    expect(await app.auth.previewProfile({ organizationName: USA.organization })).toMatchObject(USA);

    // Leave the session as the fixture opened it
    await app.auth.switchProfile({
      organizationName: initialProfile.organization,
      warehouseName: initialProfile.warehouse,
    });
    expect(await app.auth.currentProfile()).toEqual(initialProfile);
  });
});
