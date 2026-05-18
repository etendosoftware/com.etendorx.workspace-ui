describe("LinkedItems Navigation", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("Navigates to Sales Order and Goods Shipment, verifying LinkedItems navigation", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });

    cy.selectRoleOrgWarehouse();

    // =========================================================================
    // PART 1: Sales Order
    // =========================================================================

    // -------------------------
    // Step 1: Navigate to Sales Order
    // -------------------------
    cy.openDrawer();

    cy.typeInGlobalSearch("sales order");

    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });

    cy.url({ timeout: 15000 }).should("include", "/window");

    // -------------------------
    // Step 2: Select first record from the grid
    // -------------------------
    cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 15000 })
      .filter(":visible")
      .should("be.visible")
      .clear()
      .type("50012{enter}", { force: true });

    cy.wait(1000);

    cy.contains("tr", "50012", { timeout: 10000 })
      .should("be.visible")
      .find('button[data-testid^="form-button-"]')
      .click();

    // -------------------------
    // Step 3: Click on Linked Items tab
    // -------------------------
    cy.intercept("POST", "**/UsedByLink**").as("linkedItemsLoad");

    cy.contains("button", "Linked Items", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    cy.wait("@linkedItemsLoad");

    // -------------------------
    // Step 4: Click on Sales Quotation - Line Tax linked item
    // -------------------------
    cy.contains("button", "Sales Quotation - Line Tax", { timeout: 15000 })
      .scrollIntoView()
      .should("be.visible")
      .click();

    // -------------------------
    // Step 5: Click on the linked record detail
    // -------------------------
    cy.contains("p", /50012.*Exempt.*VAT/, { timeout: 15000 })
      .scrollIntoView()
      .should("be.visible")
      .click();

    // -------------------------
    // Step 6: Verify navigation to Sales Quotation window on Line Tax tab
    // -------------------------
    cy.contains("span", "Sales Quotation", { timeout: 15000 }).should("be.visible");

    cy.contains("button", "Line Tax", { timeout: 10000 }).should("be.visible");

    // =========================================================================
    // PART 2: Goods Shipment
    // =========================================================================

    // -------------------------
    // Step 7: Navigate to Goods Shipment
    // -------------------------
    cy.typeInGlobalSearch("goods shipment");

    cy.contains('[data-testid^="MenuTitle__"]', "Goods Shipment", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });

    cy.url({ timeout: 15000 }).should("include", "/window");

    // -------------------------
    // Step 8: Clear filters
    // -------------------------

    cy.wait(1000);

    // -------------------------
    // Step 9: Search for record 1000000 and enter it

    // -------------------------

    cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 15000 })
      .filter(":visible")
      .should("be.visible")
      .clear()
      .type("500014{enter}", { force: true });

    cy.wait(1000);

    // Column virtualization is enabled, so the date column may not be in the DOM
    // until the table is scrolled horizontally. Actions column is pinned so the
    // form button remains accessible after scrolling.
    cy.get(".MuiTableContainer-root").scrollTo("right", { ensureScrollable: false });

    cy.contains("tr", "2014", { timeout: 10000 })
      .scrollIntoView()
      .should("be.visible")
      .find('button[data-testid^="form-button-"]')
      .click();

    // -------------------------
    // Step 10: Click on Linked Items tab
    // -------------------------
    cy.intercept("POST", "**/UsedByLink**").as("linkedItemsLoad2");

    cy.contains("button", "Linked Items", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    cy.wait("@linkedItemsLoad2");

    // -------------------------
    // Step 11: Click on Goods Shipment - Lines linked item
    // -------------------------
    cy.contains("button", "Goods Shipment - Lines", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    // -------------------------
    // Step 12: Click on the linked record detail
    // -------------------------
    cy.contains("p", /500014.*Customer A.*costing Product 2/, { timeout: 15000 })
      .scrollIntoView()
      .should("be.visible")
      .click();

    // -------------------------
    // Step 13: Verify navigation to Goods Shipment window on Lines tab
    // -------------------------
    cy.contains("p", "Goods Shipment", { timeout: 15000 }).should("be.visible");

    cy.contains("button", "Lines", { timeout: 10000 }).should("be.visible");

    // =========================================================================
    // PART 3: Purchase Invoice
    // =========================================================================

    // -------------------------
    // Step 14: Navigate to Purchase Invoice
    // -------------------------
    cy.typeInGlobalSearch("purchase invoice");

    cy.contains('[data-testid^="MenuTitle__"]', "Purchase Invoice", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });

    cy.url({ timeout: 15000 }).should("include", "/window");

    // -------------------------
    // Step 15: Search for record 10000000 and enter it
    // -------------------------
    cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 15000 })
      .filter(":visible")
      .should("be.visible")
      .clear()
      .type("10000017{enter}", { force: true });

    cy.wait(1000);

    cy.contains("tr", "10000017", { timeout: 10000 })
      .should("be.visible")
      .find('button[data-testid^="form-button-"]')
      .click();

    // -------------------------
    // Step 16: Click on Linked Items tab
    // -------------------------
    cy.intercept("POST", "**/UsedByLink**").as("linkedItemsLoad3");

    cy.contains("button", "Linked Items", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    cy.wait("@linkedItemsLoad3");

    // -------------------------
    // Step 17: Click on Purchase Invoice - Basic Discounts
    // -------------------------
    cy.contains("button", "Purchase Invoice - Basic Discounts", { timeout: 15000 })
      .scrollIntoView()
      .should("be.visible")
      .click();

    // -------------------------
    // Step 18: Click on the linked record detail
    // -------------------------
    cy.contains("p", "10000017", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    // -------------------------
    // Step 19: Navigate to the record via the blue link
    // -------------------------
    cy.contains("p.text-sm.text-blue-600", "10000017", { timeout: 15000 })
      .scrollIntoView()
      .should("be.visible")
      .click();

    // -------------------------
    // Step 20: Verify navigation to Purchase Invoice window
    // -------------------------
    cy.contains("p", "Purchase Invoice", { timeout: 15000 }).should("be.visible");

    cy.contains("button", "Basic Discounts", { timeout: 10000 }).should("be.visible");
  });
});
