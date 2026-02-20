describe('Requisition flow - Create and generate Purchase Order', () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Processes a requisition and creates a Purchase Order from Manage Requisitions', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(1000);

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

    cy.get('.h-14 > div > .transition > svg').click();
    cy.wait(500);

    cy.typeInGlobalSearch('requi');
    cy.wait(500);
    cy.get('[data-testid="MenuTitle__800216"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(1000);
    cy.clickNewRecord()
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(1000);
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40C5CF02F5"] > .truncate').click();
    cy.wait(1000);
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(1000);
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(1000);
    cy.get('button[aria-label="Lines"]').click();
    cy.wait(1000);
    cy.clickNewRecord()
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(1000);
    cy.get('[data-testid="OptionItem__2C873A988D5146EAA9B54BA6F00F3D71"] > .truncate').click();
    cy.wait(1000);

    cy.get('[aria-describedby="Business Partner-help"]')
      .contains('span', /Vendor A|Select|Search/i)
      .click({ force: true });
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();
    cy.wait(1000);

    const d = new Date()
    const mmddyyyy =
      `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`

    cy.get('#needByDate', { timeout: 10000 })
      .scrollIntoView({ block: 'center' })
      .clear({ force: true })
      .type(mmddyyyy, { delay: 0 })
      .blur()

    cy.get('#needByDate', { timeout: 10000 }).should('have.value', mmddyyyy)

    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(1000);
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();

    cy.wait(1000)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(1000)

    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Post Requisition')
    cy.wait(1000)
    cy.get('[data-testid="close-button"]').click();

    cy.wait(1000)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(1000)


    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Post Requisition')
    cy.wait(1000)

    cy.clickOkInLegacyPopup()
    cy.wait(1000)

    cy.get('.mb-1').should('be.visible');
    cy.get('[data-testid="close-button"]').click();
    cy.wait(1000);

    cy.captureDocumentNumber()
    cy.wait(1000);

    cy.typeInGlobalSearch('requi');
    cy.wait(500);
    cy.get('[data-testid="MenuTitle__1004400000"] > .flex.overflow-hidden > .relative > .ml-2').click();

    cy.wait(1000);
    cy.get('@orderNumber').then((orderNumber) => {
      cy.get('table thead').should('be.visible')

      cy.get('input[placeholder*="Document No"]')
        .should('be.visible')
        .clear()
        .type(`${orderNumber}{enter}`)

      cy.contains('.MuiTableBody-root tr', orderNumber)
        .should('be.visible')

      cy.get('.MuiTableBody-root tr').should('have.length', 1)

      cy.contains('Showing 1 record').should('be.visible')

    })

    cy.get('input[type="checkbox"][aria-label="Toggle select row"]')
      .should('exist')
      .check({ force: true })

    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.get('.rounded-2xl > :nth-child(1)').click();
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('be.visible');

    cy.wait(1000);

    cy.clickOkInLegacyPopup()

    cy.get('.mb-1').should('be.visible');

    cy.get('[data-testid="close-button"]').click();

  });
});    