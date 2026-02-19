describe('Procurement flow - Purchase Invoice with payment registration', () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Completes a Purchase Invoice, adds payment and validates payment details', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(500);

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

    cy.get('.h-14 > div > .transition > svg').click();
    cy.wait(500);

    cy.typeInGlobalSearch('purch');
    cy.wait(500);
    cy.get('[data-testid="MenuTitle__206"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500);
    cy.clickNewRecord()
    cy.wait(500);
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(500);
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();
    cy.wait(500);
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500);
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
    cy.wait(500);
    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);
    cy.clickNewRecord()
    cy.wait(500);
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(500);
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]').click();
    cy.wait(500);

    cy.get('[data-testid="TextInput__3374"]').clear('11');
    cy.wait(500);

    cy.get('[data-testid="TextInput__3374"]').type('11,2');

    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(500);

    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
    cy.wait(500);

    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.wait(500);

    cy.get('.rounded-2xl > :nth-child(1)').click();
    cy.wait(500);

    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('be.visible');
    cy.wait(500)

    cy.clickOkInLegacyPopup()
    cy.wait(500)

    cy.get('[data-testid="close-button"]').click();

    cy.get('button.toolbar-button-refresh')
      .filter(':visible')
      .first()
      .should('be.enabled')
      .click()
    cy.wait(500)

    cy.contains('button', 'Available Process').click();

    cy.get('.rounded-2xl > :nth-child(1)').click();
    cy.wait(2000)
    cy.contains('div[tabindex="0"] > span', 'Select an option', { timeout: 20000 })
      .should('be.visible')
      .parent()
      .click();

    cy.contains('li[data-testid^="OptionItem__"] span', 'Process Made Payment(s)', { timeout: 20000 })
      .should('be.visible')
      .click();

    cy.get('[data-testid="ExecuteButton__761503"]').click();
    cy.wait(500)

    //verify payment transaction
    cy.contains('p', /^Created Payment:\s*\d+/)
      .should('be.visible')

    cy.wait(1000);

    cy.closeSuccessOverlay();

    cy.get('button[title="Payment Plan"]')
      .should('be.visible')
      .click();
    cy.wait(500)

    cy.get('span[name="paymentComplete"]')
      .should('be.visible')
      .and('have.text', 'Yes');


  });
});