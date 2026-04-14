describe("Breadcrumb Overflow Collapse", () => {
  beforeEach(() => {
    cy.cleanupEtendo();
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 1: No overflow with 2 items (window title + level-0 record)
  // The "..." button must NOT appear when the breadcrumb has only two items
  // because the overflow hook never collapses when items.length <= 2.
  // -------------------------------------------------------------------------
  it("does not show ellipsis button when breadcrumb has two items", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.selectRoleOrgWarehouse();

    // Step 1: Navigate to the Sales Order window
    cy.openDrawer();
    cy.typeInGlobalSearch("sales order");
    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.url({ timeout: 15000 }).should("include", "/window");

    // Step 2: Filter to a known record and open its form view (produces 2 breadcrumb items)
    cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 15000 })
      .filter(":visible")
      .should("be.visible")
      .clear()
      .type("50066{enter}", { force: true });
    cy.wait(1000);

    cy.contains("tr", "50066", { timeout: 10000 })
      .should("be.visible")
      .find('button[data-testid^="form-button-"]')
      .click();

    // Step 3: Breadcrumb has exactly 2 items — window title and the level-0 record identifier.
    // The overflow hook does not collapse when items.length <= 2, so no "..." button should exist.
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
        cy.get('button[aria-label="Show hidden breadcrumb items"]').should("not.exist");
      });
  });

  // -------------------------------------------------------------------------
  // Scenario 2 + 3 + 4: Navigate deep enough to reach 4 breadcrumb items
  // (window title / level-0 record / level-1 line record / level-2 tax line record).
  // With long identifiers and a 1280 px viewport this triggers the overflow hook,
  // causing the "..." button to appear.  Clicking "..." opens a dropdown listing
  // the hidden middle items.  Clicking a menu item inside that dropdown calls its
  // onClick and closes the menu.
  // -------------------------------------------------------------------------
  it("shows ellipsis button when breadcrumb overflows with 4 items, opens dropdown, and navigates on item click", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.selectRoleOrgWarehouse();

    // Step 1: Navigate to Sales Order window
    cy.openDrawer();
    cy.typeInGlobalSearch("sales order");
    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.url({ timeout: 15000 }).should("include", "/window");

    // Step 2: Filter to record 50066 (the example from the feature description that
    // produces long multi-segment identifiers at each sub-level)
    cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 15000 })
      .filter(":visible")
      .should("be.visible")
      .clear()
      .type("50066{enter}", { force: true });
    cy.wait(1000);

    // Step 3: Open the record in form view — produces level-0 breadcrumb item
    cy.contains("tr", "50066", { timeout: 10000 })
      .should("be.visible")
      .find('button[data-testid^="form-button-"]')
      .click();

    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 }).within(() => {
      cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
    });

    // Step 4: Navigate to the Lines sub-tab (level 1)
    cy.contains("button", "Lines", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    // Step 5: Open the first Lines record in form view — produces level-1 breadcrumb item
    cy.get('button[data-testid^="form-button-"]', { timeout: 15000 }).first().scrollIntoView().click();

    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 }).within(() => {
      cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 3);
    });

    // Step 6: Navigate to the Tax Lines sub-tab (level 2) to produce a 4th breadcrumb item.
    // "Tax Lines" is a standard sub-tab inside an Order Line in Etendo Classic.
    cy.contains("button", "Tax Lines", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    // Step 7: Open the first Tax Line record — produces level-2 breadcrumb item
    cy.get('button[data-testid^="form-button-"]', { timeout: 15000 }).first().scrollIntoView().click();

    // Step 8: With 4 items (window title / level-0 / level-1 / level-2) the overflow hook
    // detects scrollWidth > clientWidth on the breadcrumb container and sets isCollapsed=true.
    // The "..." button must now be present as a sibling breadcrumb entry.
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get('button[aria-label="Show hidden breadcrumb items"]', { timeout: 15000 })
          .should("be.visible");

        // The first and last breadcrumb items are always visible
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").first().should("be.visible");
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").last().should("be.visible");
      });

    // Step 9: Click the "..." button to open the collapsed items dropdown menu
    cy.get('[data-testid="Breadcrumb__50ef19"]')
      .find('button[aria-label="Show hidden breadcrumb items"]')
      .scrollIntoView()
      .click();

    // Step 10: The MUI Menu opens.  It lists the hidden middle breadcrumb items as
    // MenuItem elements rendered inside a Popper/Paper overlay (role="menu" or "listbox").
    // There must be at least one item visible in the dropdown.
    cy.get('[role="menu"]', { timeout: 10000 }).should("be.visible");
    cy.get('[role="menu"] .MuiMenuItem-root').should("have.length.gte", 1);

    // Step 11: Capture the label of the first menu item (the level-0 record identifier)
    // and click it.  This triggers its onClick, which calls setFocus on the level-0 tab
    // and navigates back up the breadcrumb hierarchy.
    cy.get('[role="menu"] .MuiMenuItem-root').first().scrollIntoView().click();

    // Step 12: After clicking the collapsed item the menu must close.
    cy.get('[role="menu"]').should("not.exist");

    // Step 13: The view is now focused at the level that was clicked, so the breadcrumb
    // should still include the Sales Order window title.
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.contains("Sales Order").should("be.visible");
      });
  });
});
