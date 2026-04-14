describe("Hierarchical Breadcrumb Navigation", () => {
  beforeEach(() => {
    cy.cleanupEtendo();
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("verifies multi-level breadcrumb items, Window Title reset, and back button behaviour", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.selectRoleOrgWarehouse();

    // -------------------------
    // Step 1: Navigate to Sales Order window via the drawer
    // -------------------------
    cy.openDrawer();
    cy.typeInGlobalSearch("sales order");
    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.url({ timeout: 15000 }).should("include", "/window");

    // -------------------------
    // Step 2: Confirm breadcrumb shows only the Window Title at Level 0 (grid view)
    // The breadcrumb container is rendered by AppBreadcrumb with data-testid="Breadcrumb__50ef19".
    // At this point there is no record selected, so only the window title item must be visible.
    // -------------------------
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.contains("Sales Order").should("be.visible");
      });

    // -------------------------
    // Step 3: Open a record to reach FormView at Level 0
    // Filter to a known document number so the test is deterministic.
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
    // Step 4: Verify that the Level 0 record identifier appears in the breadcrumb
    // (second item after the window title).
    // The breadcrumb now has at least two items: "Sales Order" and the record identifier.
    // -------------------------
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        // Window title item is still present
        cy.contains("Sales Order").should("be.visible");
        // The record identifier for document 50012 should be the second breadcrumb item
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
      });

    // -------------------------
    // Step 5: Navigate to a Level 1 sub-tab (Lines) to generate a Level 1 breadcrumb item
    // -------------------------
    cy.contains("button", "Lines", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    // -------------------------
    // Step 6: Open a Lines record so Level 1 selection is reflected in the breadcrumb
    // -------------------------
    cy.get('button[data-testid^="form-button-"]', { timeout: 15000 }).first().scrollIntoView().click();

    // -------------------------
    // Step 7: With both Level 0 and Level 1 records selected, the breadcrumb should
    // show three items: Window Title / Level 0 record / Level 1 record
    // -------------------------
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 3);
      });

    // -------------------------
    // Step 8: Click the Window Title breadcrumb item (first clickable item)
    // This must reset the view: collapse Level 1, clear form states, focus Level 0 grid.
    // After the click the URL should no longer reference a sub-level form and the
    // breadcrumb should revert to displaying only the window title.
    // -------------------------
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 10000 }).within(() => {
      // The window title is rendered as a MUI Button (non-last item) or Typography.
      // We target it by its known text content.
      cy.contains("Sales Order").click();
    });

    // After clicking the Window Title the app navigates back to the grid at Level 0.
    // The breadcrumb should now show only the Window Title (one list item).
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length", 1);
        cy.contains("Sales Order").should("be.visible");
      });

    // -------------------------
    // Step 9: Open the same record again to enter FormView
    // -------------------------
    cy.contains("tr", "50012", { timeout: 10000 })
      .should("be.visible")
      .find('button[data-testid^="form-button-"]')
      .click();

    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 }).within(() => {
      cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
    });

    // -------------------------
    // Step 10: Click the back button (ArrowLeft icon, aria-label "Go back") while in FormView.
    // Expected: returns to the grid at Level 0 WITHOUT navigating away from the window.
    // The breadcrumb reverts to one item and the URL still contains "/window".
    // -------------------------
    cy.get('[aria-label="Go back"]', { timeout: 10000 }).first().scrollIntoView().click();

    cy.url({ timeout: 10000 }).should("include", "/window");
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 }).within(() => {
      cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length", 1);
    });

    // -------------------------
    // Step 11: Back button from Level 0 grid navigates to Home.
    // At this point the view is already at Level 0 grid, so clicking back again
    // should deactivate the window and land the user on the home/dashboard screen.
    // -------------------------
    cy.get('[aria-label="Go back"]', { timeout: 10000 }).first().scrollIntoView().click();

    // Home/dashboard does not include "/window" in the URL
    cy.url({ timeout: 10000 }).should("not.include", "/window");
  });

  // -------------------------
  // Fix 0.1: Breadcrumb shows record identifier in Grid mode (not just Form mode)
  // When a row is selected (highlighted) in Grid mode, the breadcrumb should
  // already display the record identifier — without opening the FormView.
  // -------------------------
  it("shows record identifier in breadcrumb when record is selected in Grid mode", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.selectRoleOrgWarehouse();

    // Navigate to Sales Order window
    cy.openDrawer();
    cy.typeInGlobalSearch("sales order");
    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.url({ timeout: 15000 }).should("include", "/window");

    // Filter to a known record
    cy.get('input.w-full[placeholder="Filter Document No...."]', { timeout: 15000 })
      .filter(":visible")
      .should("be.visible")
      .clear()
      .type("50012{enter}", { force: true });
    cy.wait(1000);

    // Confirm only window title is in the breadcrumb before any selection
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length", 1);
        cy.contains("Sales Order").should("be.visible");
      });

    // Select the row in Grid mode (click the row itself, NOT the form-button)
    // This sets selectedRecord on the tab without switching to FormView.
    cy.contains("tr", "50012", { timeout: 10000 }).should("be.visible").click();

    // The breadcrumb must now show the Level 0 record identifier even though
    // the user is still in Grid mode (Fix 0.1: reads from selectedRecord, not formRecord).
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
        // Window title remains
        cy.contains("Sales Order").should("be.visible");
      });
  });

  // -------------------------
  // N-level: Both Level 0 AND Level 1 identifiers appear simultaneously
  // when navigating to a sub-tab and selecting a record there.
  // Also validates Fix 0.2: no "..." overflow button — all items are always visible.
  // -------------------------
  it("shows Level 0 and Level 1 breadcrumb items simultaneously without overflow collapse", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.selectRoleOrgWarehouse();

    // Navigate to Sales Order window
    cy.openDrawer();
    cy.typeInGlobalSearch("sales order");
    cy.contains('[data-testid^="MenuTitle__"]', "Sales Order", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.url({ timeout: 15000 }).should("include", "/window");

    // Filter and open Level 0 record in FormView
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

    // Breadcrumb: 2 items — Window Title + Level 0 record identifier
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
      });

    // Navigate to Lines sub-tab (Level 1)
    cy.contains("button", "Lines", { timeout: 15000 }).scrollIntoView().should("be.visible").click();

    // Select a Level 1 record (open FormView for Lines)
    cy.get('button[data-testid^="form-button-"]', { timeout: 15000 }).first().scrollIntoView().click();

    // Breadcrumb must now show 3 items: Window Title / Level 0 record / Level 1 record
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        const breadcrumbItems = cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li");
        breadcrumbItems.should("have.length.gte", 3);

        // Fix 0.2: no "..." expansion button must exist — all items are rendered directly.
        // MUI Breadcrumbs renders a collapse button with aria-label "Show path" when
        // maxItems is exceeded. With Fix 0.2 there is no maxItems cap, so this element
        // must be absent.
        cy.get('button[aria-label="Show path"]').should("not.exist");
        cy.get(".MuiBreadcrumbs-separator").should("have.length.gte", 2);

        // Window Title is still present
        cy.contains("Sales Order").should("be.visible");
      });

    // -------------------------
    // Clicking the Level 0 breadcrumb item (record identifier) focuses Level 0
    // and returns the view to Level 0 without losing the window context.
    // The breadcrumb then collapses back to 2 items (Window Title + Level 0 record).
    // -------------------------
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 10000 }).within(() => {
      // The Level 0 record item is the second .MuiBreadcrumbs-li (index 1),
      // rendered as a MUI Button (non-last item in the list).
      cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").eq(1).find("button").click();
    });

    cy.url({ timeout: 10000 }).should("include", "/window");

    // After focusing Level 0 via breadcrumb click, Level 1 record is deselected
    // so only 2 items remain: Window Title + Level 0 record.
    cy.get('[data-testid="Breadcrumb__50ef19"]', { timeout: 15000 })
      .should("be.visible")
      .within(() => {
        cy.get(".MuiBreadcrumbs-ol .MuiBreadcrumbs-li").should("have.length.gte", 2);
      });
  });
});
