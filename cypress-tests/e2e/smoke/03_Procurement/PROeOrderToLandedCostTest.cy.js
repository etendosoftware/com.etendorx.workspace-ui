describe.skip('Purchase Order to Landed Cost flow', () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Processes Landed Cost from Goods Receipt and validates cost distribution', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(2000);

    cy.selectRoleOrgWarehouse({
      roleOptionId: '#role-select-option-3',
      organizationOptionId: '#organization-select-option-2'
    });

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
    cy.wait(2000)

    cy.contains('Main Section').should('be.visible')

    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full').click();

    cy.get('[data-testid="OptionItem__9C91AE200EFA4A61836D79A2E99E29DB"] > .truncate').click();

    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();

    cy.get(':nth-child(2) > .bg-\\(--color-transparent-neutral-5\\) > div > :nth-child(1) > .px-2').click();
    cy.get('[style="height: 50%;"] > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full').click();

    cy.get('[data-testid="OptionItem__61047A6B06B3452B85260C7BCF08E78D"] > .truncate').click();
    cy.get('[data-testid="TextInput__3389"]').clear('10');
    cy.get('[data-testid="TextInput__3389"]').type('10');

    cy.get('[style="height: 50%;"] > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();

    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Book').click();

    cy.wait(2000)

    cy.get('[data-testid="close-button"]').click()
    cy.wait(2000)

    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(500)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Book').click();

    cy.clickOkInLegacyPopup()
    cy.wait(2000)

    cy.get('[data-testid="close-button"]').click()

    cy.typeInGlobalSearch('goods')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__204"] > .flex.overflow-hidden > .relative > .ml-2').click();

    cy.get('[data-testid="MenuTitle__204"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(2000)
    cy.get('.m-0.flex-1 > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
    cy.wait(2000)
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();

    cy.get('[data-testid="OptionItem__9C91AE200EFA4A61836D79A2E99E29DB"] > .truncate').click();

    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(2000)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();
    cy.wait(2000)
    cy.get('.rounded-2xl > :nth-child(1)').click();

    cy.log('Esperando frame legacy...');
    cy.wait(4000);

    cy.getCreateFromInnerBody().within(() => {
      cy.log('Frame encontrado, esperando select de órdenes...');
      cy.get('#inpPurchaseOrder', { timeout: 20000 })
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
          cy.wait(3000);
        });
    });

    cy.getCreateFromInnerBody().within(() => {
      cy.log('Seleccionando Storage Bin (Locator)...');

      cy.get('#paramM_Locator_ID_DES', { timeout: 10000 })
        .should('exist')
        .then($input => {
          const locatorInput = $input[0];
          const win = locatorInput.ownerDocument.defaultView;

          locatorInput.value = '';

          locatorInput.value = 'RN-2-0-0';

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

          cy.wait(2000);
        });
    });

    cy.captureDocumentNumber()

    cy.getCreateFromInnerBody().within(() => {
      cy.log('Esperando checkboxes de líneas...');
      cy.get('input[type="checkbox"]', { timeout: 20000 })
        .should('have.length.greaterThan', 0)
        .then($chks => {
          $chks[$chks.length - 1].click();
        });

      cy.get('td.Button_text').contains('OK').click();
    });

    cy.wait(2000);

    cy.get('[data-testid="close-button"]').click();
    cy.get(':nth-child(2) > .bg-\\(--color-transparent-neutral-5\\) > div > :nth-child(1) > .px-2').click();

    cy.wait(2000);

    cy.get('[data-testid^="ExternalLinkIcon"]')
      .filter(':visible')
      .first()
      .click({ force: true });
    cy.get('[aria-describedby="Attribute Set Value-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('1F5EE971D46E46889B4BDAE617108ED8');
    cy.get('[aria-describedby="Attribute Set Value-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('1F5EE971D46E46889B4BDAE617108ED8');
    cy.wait(2000)
    cy.get('[style="height: 50%;"] > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();

    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(2000)

    cy.get('.rounded-2xl').contains('.cursor-pointer', 'Complete').click();

    cy.clickOkInLegacyPopup()
    cy.get('[data-testid="close-button"]').click();
    cy.wait(1000)

    cy.typeInGlobalSearch('Process')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__BE86736DF4AB4568A316A3922E6D6B7B"]').click();

    cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.wait(1000);

    cy.get('tbody tr').eq(0)
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(2000)

    cy.contains('Reschedule Process').click();

    cy.get('[data-testid="close-button"]').click();

    cy.typeInGlobalSearch('lande')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__D0EB635DAB004B16B636122FEA516898"]').click();

    cy.get('button.toolbar-button-new')
      .contains('New Record')
      .first()
      .should('be.visible')
      .click()
    cy.wait(2000)

    cy.get('.m-0.flex-1 > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > .relative > [data-testid="IconButton__25D1FA357A484AE38A3E2382889198FE"] > .w-4').click();

    cy.get('.w-full > :nth-child(2) > [data-testid="IconButton__3F10D0819EF34C7783EB3C129688B84E"] > .w-4').click();


    cy.get('.m-0.flex-1 > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]').click();

    cy.get('[aria-describedby="Document Type-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.get('[data-testid="OptionItem__699BB430EAE24D9AB9524817C7314B2A"] > .truncate').click();

    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]').click();

    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();

    cy.get('button[aria-label="Cost"]').click();

    cy.contains('button', 'New Record').click();

    cy.get('[data-testid="TextInput__0056819E516C679FE050007F01000569"]')
      .clear()
      .type('1');

    cy.get('button.toolbar-button-save').eq(1).click();

    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
    cy.wait(1000)

    cy.get('button[aria-label="Receipt"]').click();

    cy.contains('button', 'New Record').click();

    cy.get('[aria-describedby="Goods Receipt-help"]')
      .find('[tabindex="-1"]')
      .should('be.visible')
      .click();

    cy.wait(1000);


    cy.get('@orderNumber').then((orderNumber) => {
      cy.get('input[placeholder="Search..."]')
        .should('be.visible')
        .clear()
        .type(orderNumber, { delay: 150 });

      cy.wait(3000);

      cy.contains(orderNumber, { timeout: 10000 })
        .should('be.visible')
        .click();

    });

    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]')
      .last()
      .should('be.visible')
      .click();

    cy.get('[data-testid="BasicModal_CloseIcon"]').click();

    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click();

    cy.get('.rounded-2xl > .cursor-pointer').click();

    cy.get('[data-testid="ExecuteButton__761503"] > :nth-child(2)').click();

    cy.contains('Process completed successfuly')
      .should('be.visible');


  });
});