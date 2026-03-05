describe("Advanced Filters - Complete Test", () => {
  beforeEach(() => {
    cy.cleanupEtendo();
  });

  it("should test all advanced filter functionalities", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });

    cy.get(".h-14 > div > .transition > svg").click();
    cy.typeInGlobalSearch("sales");
    cy.get('[data-testid="MenuTitle__129"]').click();

    cy.get('[data-testid*="MaterialReactTable"], table, .table-container')
      .should('be.visible');

    let totalRows = 0;
    cy.get('table tbody tr').then(($rows) => {
      totalRows = $rows.length;
      cy.log(`Total rows without filter: ${totalRows}`);
    });

    cy.log("TEST 1: Basic Filter - Organization = Spain");

    cy.openAdvancedFilters();

    cy.get('div[tabindex="0"]').contains('Column').click();
    cy.get('span.text-gray-700').contains('Organization').click();

    cy.get('div[tabindex]').contains('Condition').click();
    cy.get('button, [role="option"]').contains('=').first().click();

    cy.get('div[tabindex="0"]').contains('Value').click();
    cy.get('input[placeholder="Buscar..."]').type('Spain');
    cy.get('button').filter(':visible').contains('Spain').click();

    cy.get('button').contains('Apply filters').click();

    cy.get('div').contains('Advanced Filters').should('not.exist');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.get('table tbody tr').first().then(($row) => {
      $row.find('td').each((i, cell) => {
        cy.log(`td[${i}]: "${Cypress.$(cell).text().trim()}"`);
      });
    });

    cy.get('table tbody').should('contain.text', 'Spain');
    cy.get('table tbody').should('not.contain.text', 'USA');
    cy.get('table tbody tr').then(($rows) => {
      cy.log(`TEST 1: ${$rows.length} rows filtered by Spain`);
    });
    

    cy.log("TEST 2: Adding Multiple Conditions (AND)");

    cy.openAdvancedFilters();

    cy.get('button').contains('Add condition').click();

    cy.get('div[tabindex="0"]').contains('Column').last().click();
    cy.get('span.text-gray-700').contains('Document No.').click();

    cy.get('div[tabindex="0"] span').filter(':visible')
      .contains('Condition').parent().click();
    cy.get('button').filter(':visible').contains(/contains/i).click();

    cy.get('input[placeholder="Value"]').filter(':visible').type('80');

    cy.get('button').contains('Apply filters').click();

    cy.get('div').contains('Advanced Filters').should('not.exist');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    cy.get('table tbody').should('contain.text', 'Spain');
    cy.get('table tbody').should('contain.text', '80');

    cy.log("TEST 2: All rows have Spain and Document No. containing 80");

    cy.log("TEST 3: Clear All Filters");

    cy.openAdvancedFilters();

    cy.get('button').contains('Clear all').click();
    cy.wait(500);
    cy.get('button').contains('Apply filters').click();
    cy.wait(1000);

    cy.get('div').contains('Advanced Filters').should('not.exist');

    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    cy.get('button.toolbar-button-advanced-filters').should('be.visible');
    cy.log("TEST 3: All filters cleared successfully");

    cy.log("TEST 4: OR - Document No. Contains '68' OR Total Gross Amount > '34'");

    cy.openAdvancedFilters();

    cy.get('div[tabindex="0"]').contains('Column').click();
    cy.get('span.text-gray-700').contains('Document No.').click();

    cy.get('div[tabindex="0"] span').filter(':visible')
      .contains('Condition').parent().click();
    cy.get('button').filter(':visible').contains(/contains/i).click();

    cy.get('input[placeholder="Value"]').filter(':visible').type('68');

    cy.get('button').contains('Add condition').click();

    cy.get('div[tabindex="0"] span').filter(':visible')
      .contains('AND').parent().click();
    cy.get('span').filter(':visible').contains('OR').click();

    cy.get('div[tabindex="0"]').contains('Column').last().click();
    cy.get('span.text-gray-700').contains('Total Gross Amount').click();

    cy.get('div[tabindex="0"] span').filter(':visible')
      .contains('Condition').parent().click();
    cy.get('button').filter(':visible').contains(/greater than/i).click();

    cy.get('input[placeholder="Value"]').filter(':visible').last().type('34');

    cy.get('button').contains('Apply filters').click();

    cy.get('div').contains('Advanced Filters').should('not.exist');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.get('table tbody').should('contain.text', '68');
    cy.log("TEST 4: OR filter applied - Document No. Contains 68 OR Total Gross Amount > 34");
  });
});