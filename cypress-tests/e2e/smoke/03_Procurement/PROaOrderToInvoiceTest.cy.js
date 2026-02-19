describe('Purchase Order to Invoice flow', () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Completes Purchase Order, Goods Receipt and posts the Vendor Invoice', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(500);

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

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
    cy.get('button[aria-label="Lines"]').click();
    cy.clickNewRecord();

    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"] > .truncate').click();
    cy.get('[data-testid="TextInput__3389"]').clear('1').type('11,2');

    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
    cy.wait(2000)
    cy.captureDocumentNumber()

    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(2000)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Book').click();
    cy.wait(1000)

    cy.clickOkInLegacyPopup()
    cy.wait(500)

    cy.get('[data-testid="close-button"]').click()

    cy.typeInGlobalSearch('goods')
    cy.wait(500)

    cy.wait(500)
    cy.get('[data-testid="MenuTitle__204"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500)
    cy.clickNewRecord()
    cy.wait(500)
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(500)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.wait(500)
    cy.get('.rounded-2xl > :nth-child(1)').click();

    cy.log('Esperando frame legacy...');
    cy.wait(1000);

    cy.getCreateFromInnerBody().within(() => {
      cy.log('Frame encontrado, esperando select de órdenes...');
      cy.get('#inpPurchaseOrder', { timeout: 2000 })
        .should('exist')
        .should($sel => {
          expect($sel[0].options.length).to.be.greaterThan(1);
        })
        .then($sel => {
          const el = $sel[0];
          const lastIndex = el.options.length - 1;
          el.selectedIndex = lastIndex;

          const win = el.ownerDocument.defaultView;
          const changeEvt = new win.Event('change', { bubbles: true, cancelable: true });
          el.dispatchEvent(changeEvt);

          if (typeof el.onchange === 'function') {
            el.onchange.call(el);
          } else if (win.submitCommandForm) {
            win.submitCommandForm('FIND_PO', false, null, null, '_self');
          }
          cy.wait(1000);
        });
    });

    cy.getCreateFromInnerBody().within(() => {
      cy.log('Seleccionando Storage Bin (Locator)...');

      cy.get('#paramM_Locator_ID_DES', { timeout: 1000 })
        .should('exist')
        .then($input => {
          const locatorInput = $input[0];
          const win = locatorInput.ownerDocument.defaultView;

          locatorInput.value = '';

          locatorInput.value = 'L01';

          const inputEvent = new win.Event('input', { bubbles: true, cancelable: true });
          locatorInput.dispatchEvent(inputEvent);

          const changeEvent = new win.Event('change', { bubbles: true, cancelable: true });
          locatorInput.dispatchEvent(changeEvent);

          const enterDown = new win.KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          locatorInput.dispatchEvent(enterDown);

          const enterUp = new win.KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          locatorInput.dispatchEvent(enterUp);

          cy.wait(500);
        });
    });


    cy.getCreateFromInnerBody().within(() => {
      cy.log('Esperando checkboxes de líneas...');
      cy.get('input[type="checkbox"]', { timeout: 1000 })
        .should('have.length.greaterThan', 0)
        .then($chks => {
          $chks[$chks.length - 1].click();
        });

      cy.get('td.Button_text').contains('OK').click();
    });

    cy.wait(500);

    cy.get('[data-testid="close-button"]').click();

    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Complete').click();

    cy.clickOkInLegacyPopup()

    cy.get('[data-testid="close-button"]').click();

    cy.typeInGlobalSearch('purcha')
    cy.wait(500)
    cy.get('[data-testid="MenuTitle__206"]').click();

    cy.clickNewRecord()

    cy.get('[aria-describedby="Business Partner-help"]')
      .find('div[tabindex="0"]')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type('Vendor A', { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Vendor A$/, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('input[aria-label="Search options"]').should('not.exist');
    cy.get('[aria-describedby="Business Partner-help"]').should('contain.text', 'Vendor A');

    cy.clickSave();

    cy.get('[data-testid="BasicModal_CloseIcon"]').click();

    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.contains('Create Lines From Order').click();

    cy.get('@orderNumber').then((orderNumber) => {
      cy.get('input[placeholder="Filter by Document No."]')
        .clear()
        .type(orderNumber, { delay: 100 });

      cy.wait(1000);
    });

    cy.wait(500)

    cy.get('@orderNumber').then((orderNumber) => {
      cy.contains('tr', orderNumber).find('input[type="checkbox"]').check();
    });

    cy.get('[data-testid="ExecuteButton__761503"]').click();

    cy.get('.flex-col > :nth-child(2) > .font-medium').should('be.visible');
    cy.wait(1000)

    cy.contains('button', 'Close', { timeout: 20000 })
      .should('be.visible')
      .click()

    cy.wait(3000)

    cy.get('.fixed.inset-0').should('not.exist');

    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Complete').click();

    cy.clickOkInLegacyPopup()
    cy.wait(500)

    cy.closeToastIfPresent();

    cy.get('button[data-testid="close-button"]')
      .should('exist')
      .click({ force: true });

    cy.get('button[data-testid="close-button"]')
      .should('not.exist');

    cy.get('[data-testid="IconButton__25D1FA357A484AE38A3E2382889198FE"]').first().click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();

    cy.wait(500)
    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Post').click();
    cy.wait(500)

    cy.clickOkInLegacyPopup()
    cy.wait(500)

    cy.get('[data-testid="close-button"]').click();

  });
});





