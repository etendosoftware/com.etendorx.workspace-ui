describe('Sales flow - Generate invoices from multiple sales orders', () => {
  beforeEach(() => {
    cy.cleanupEtendo();
    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Generates invoices from processed sales orders and shipments for multiple customers', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(500);

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

    cy.get('.h-14 > div > .transition > svg').click()
    cy.wait(500)

    cy.typeInGlobalSearch('sales')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__129"]').click()
    cy.wait(500)

    cy.get('button.toolbar-button-new')
      .contains('New Record')
      .first()
      .should('be.visible')
      .click()
    cy.wait(500)

    cy.contains('Main Section').should('be.visible')
    cy.wait(500)

    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click()
    cy.wait(500)

    cy.get('[aria-describedby="Transaction Document-help"] > .w-2\\/3 > .relative > .w-full').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click()
    cy.wait(500)

    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click()
    cy.wait(500)
    cy.get('[aria-describedby="Invoice Terms-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__I"] > .truncate').click()
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()

    cy.wait(500)
    cy.get('button[aria-label="Lines"]').click()

    cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]', { timeout: 20000 })
      .filter(':visible')
      .last()
      .should('not.be.disabled')
      .click()

    cy.wait(500)
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"] > .truncate').click()
    cy.wait(500)
    cy.get('[data-testid="TextInput__1130"]').clear()
    cy.wait(500)
    cy.get('[data-testid="TextInput__1130"]').type('11')
    cy.wait(500)

    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click()

    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Process Order')
    cy.wait(2000)

    cy.clickOkInLegacyPopup()
    cy.wait(500)
    cy.get('[data-testid="close-button"]').click()

    cy.wait(500)
    cy.get(':nth-child(3) > [data-testid="IconButton__C7913FFAF4DF44BFB0392755DEAE9C89"]').click();
    cy.wait(500)
    cy.get('.bg-\\[var\\(--color-etendo-main\\)\\]').click();
    cy.wait(5000)
    cy.get('[data-testid="ChevronDownIcon__987e83"]').click();
    cy.wait(500)
    cy.get('.rounded-2xl > :nth-child(1)').click();
    cy.wait(2000)
    cy.clickOkInLegacyPopup()
    cy.wait(500)
    cy.get('[data-testid="close-button"]').click();
    cy.get(':nth-child(3) > [data-testid="IconButton__C7913FFAF4DF44BFB0392755DEAE9C89"]').click();
    cy.wait(500)
    cy.get('.bg-\\[var\\(--color-etendo-main\\)\\]').click();
    cy.wait(500)
    cy.get('[data-testid="ChevronDownIcon__987e83"]').click();
    cy.wait(500)
    cy.get('.rounded-2xl > :nth-child(1)').click();
    cy.wait(2000)
    cy.clickOkInLegacyPopup()
    cy.wait(500)
    cy.get('[data-testid="close-button"]').click();

    cy.typeInGlobalSearch('create')
    cy.wait(500)


    cy.get('[data-testid="MenuTitle__346"] > .flex.overflow-hidden > .relative > .ml-2').click();


    cy.setLegacyDate('paramDateFrom')

    cy.wait(1000)
    cy.clickLegacyButton('Search')

    cy.selectLegacyCheckboxes('inpOrder', true)

    cy.wait(1000)
    cy.clickLegacyButton('Process')
    cy.wait(500)
    cy.verifyLegacySuccessMessage('Process completed successfully')

    cy.get('[data-testid="close-button"]').click()

    cy.typeInGlobalSearch('genera')
    cy.wait(500)
    cy.wait(500)
    cy.get('[data-testid="MenuTitle__192"] > .flex.overflow-hidden > .relative > .ml-2').click();

    cy.wait(500)
    cy.get('[data-testid^="ExecuteReportButton"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click()

    cy.contains(/Process completed success/i, { timeout: 30000 }).should('be.visible')

    cy.contains(/^Created:/)
      .should('be.visible')


  });
});