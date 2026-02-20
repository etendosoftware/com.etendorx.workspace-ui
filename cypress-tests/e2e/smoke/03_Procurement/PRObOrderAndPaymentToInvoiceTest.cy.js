describe.skip('Purchase Order with advance payment flow', () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Processes advance payment and validates Purchase Invoice payments', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(2000);

    cy.get('.h-14 > div > .transition > svg').click()
    cy.wait(500)

    cy.typeInGlobalSearch('purcha')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__205"]').click();

    cy.get('button.toolbar-button-new')
      .contains('New Record')
      .first()
      .should('be.visible')
      .click()
    cy.wait(500)

    cy.contains('Main Section').should('be.visible')

    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full').click();

    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();

    cy.get(':nth-child(2) > .bg-\\(--color-transparent-neutral-5\\) > .flex > .border-b-\\(--color-neutral-90\\)').click();
    cy.get('[style="height: 50%;"] > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"] > .truncate').click();
    cy.get('[data-testid="TextInput__3389"]').clear('1').type('11,2');
    cy.get('[style="height: 50%;"] > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
    cy.captureDocumentNumber(
      ':nth-child(3) > .MuiBox-root > .MuiTypography-root',
      'invoiceNumber'
    );

    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Book').click();

    cy.wait(500)

    cy.get('[data-testid="close-button"]').click()
    cy.wait(500)

    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Book').click();

    cy.clickOkInLegacyPopup()
    cy.wait(2000)

    cy.get('[data-testid="close-button"]').click()

    cy.typeInGlobalSearch('payment')
    cy.wait(500)


    cy.get('[data-testid="MenuTitle__C3BEE7BF3F5B44C3A24D24E3DC4870EC"]').click()

    cy.get('button.toolbar-button-new')
      .contains('New Record')
      .first()
      .should('be.visible')
      .click()

    cy.get('[aria-describedby="Paying To-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.get('.rounded-2xl > .cursor-pointer').click();
    cy.selectDocumentInAddPayment('invoiceNumber', 'order');
    cy.wait(2000)

    cy.get('[title="A drop down list box indicating the actions regarding document"]')
      .contains('Select an option')
      .click();

    cy.get('[data-testid="OptionItem__DDCDE32A9FC046E694D5074144DD6AFF"]')
      .click();

    cy.get('[data-testid="ExecuteButton__761503"]').click();
    cy.wait(2000)
    cy.get('[data-testid="CloseResultButton__761503"]')
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    cy.get('#_r_e_').clear('p');
    cy.get('#_r_e_').type('purch');
    cy.get('[data-testid="MenuTitle__206"] > .flex.overflow-hidden > .relative > .ml-2').click();

    cy.get('.m-0.flex-1 > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
    cy.wait(500)
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.wait(500)
    cy.get('.rounded-2xl > :nth-child(2)').click();
    cy.wait(500)

    cy.get('@invoiceNumber').then((invoiceNumber) => {
      cy.log(`Searching for order ${invoiceNumber} in Create Lines From Order popup`);

      cy.get('input[placeholder="Filter by Document No."]', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled');

      cy.wait(1000);

      cy.get('input[placeholder="Filter by Document No."]')
        .clear()
        .type(invoiceNumber, { delay: 100 });

      cy.wait(1500);

      cy.get('tbody tr', { timeout: 10000 })
        .should('have.length.at.least', 1);

      cy.wait(500);

      cy.contains('tr', invoiceNumber)
        .find('input[type="checkbox"]')
        .check({ force: true });

      cy.wait(500);
    });

    cy.contains('button', 'Execute').click();
    cy.wait(500)
    cy.get('.flex-col > :nth-child(2) > .font-medium').should('be.visible');
    cy.get('[data-testid="SuccessCloseButton__761503"]').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.wait(500)
    cy.get('.rounded-2xl > :nth-child(1)').click();
    cy.clickOkInLegacyPopup()
    cy.get('[data-testid="close-button"]').click();


  });

});
