describe("ProcessModal - Parent refresh after iframe navigation (ETP-3649)", () => {
  beforeEach(() => {
    cy.cleanupEtendo();
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("refreshes the parent form after the process iframe navigates to the result page on close", () => {
    // Step 1: Login and select role/org/warehouse
    cy.loginToEtendo(
      Cypress.env("defaultUser"),
      Cypress.env("defaultPassword"),
      { useSession: false }
    );
    cy.selectRoleOrgWarehouse();

    // Step 2: Navigate to Sales Order via drawer search
    cy.openDrawer();
    cy.typeInGlobalSearch("sales order");
    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.url({ timeout: 15000 }).should("include", "/window");

    // Step 3: Create a new Sales Order record
    cy.intercept("POST", "**/FormInitializationComponent**").as("formInit");
    cy.clickNewRecord();
    cy.contains("Main Section", { timeout: 15000 }).should("be.visible");

    // Step 4: Select Business Partner
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.get('[data-testid^="OptionItem__"]', { timeout: 10000 }).first().click();

    // Step 5: Save the header
    cy.clickSave();
    cy.closeToastIfPresent();

    // Step 6: Navigate to Lines tab and add a line
    cy.contains("button", "Lines", { timeout: 15000 }).scrollIntoView().should("be.visible").click();
    cy.clickNewRecord();

    // Step 7: Select a product in the line
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full', { timeout: 15000 })
      .should("be.visible")
      .click();
    cy.intercept("POST", "**/FormInitializationComponent**").as("productFormInit");
    cy.get('[data-testid^="OptionItem__"]', { timeout: 10000 }).first().click();
    cy.wait("@productFormInit", { timeout: 30000 });

    // Step 8: Save the line
    cy.clickSave();
    cy.closeToastIfPresent();

    // Step 9: Capture the document number so we can assert status change later
    cy.captureDocumentNumber(
      "p.MuiTypography-root.MuiTypography-body1.MuiTypography-noWrap",
      "salesOrderNumber"
    );

    // Step 10: Open the process menu and select "Process Order"
    // The process modal opens with the legacy Classic iframe
    cy.openProcessMenu(1, "Process Order");

    // Step 11: Wait for the legacy iframe to be visible inside the process modal
    cy.get(
      `iframe[src*="${Cypress.env("iframeUrl") || "classic-new-mainui"}"], iframe[src*="localhost:8080"]`,
      { timeout: 20000 }
    ).should("be.visible");

    // Step 12: Click OK in the legacy iframe popup
    // This causes the iframe to navigate to the result page — the second onLoad event
    // is what ETP-3649 detects as "hasNavigated = true"
    cy.clickOkInLegacyPopup();

    // Step 13: Verify the process success toast appears
    cy.get("[data-sonner-toast]", { timeout: 30000 }).should("contain.text", "Process completed successfully");

    // Step 14: Close the process modal
    // Before ETP-3649 this would NOT call onProcessSuccess because
    // only processWasSuccessful was checked. Now hasNavigated also triggers the refresh.
    cy.get('[aria-label="Close"]', { timeout: 10000 }).scrollIntoView().click({ force: true });

    // Step 15: Verify the parent form has been refreshed by checking that the
    // Sales Order status is now "Booked" — this value is only present after the
    // parent triggers a reload via onProcessSuccess
    cy.contains('[data-testid^="TextInput__"], [data-testid^="SelectInput__"], .field-value', "Booked", {
      timeout: 20000,
    }).should("be.visible");
  });
});
