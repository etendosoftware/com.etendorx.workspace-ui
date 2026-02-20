describe('User Management - Create user and assign role', () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    // Ignore hydration errors that don't affect the tests
    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });
  });

  it('Create user, assign role and verify login access', () => {
    const pwd = '1234567Ag!';
    const username = `qa_${Date.now()}`;
    const name = username;
    cy.loginToEtendo('admin', 'admin', { useSession: false });
    cy.wait(1000);

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

    cy.get('.h-14 > div > .transition > svg')
      .should('be.visible')
      .click();

    cy.typeInGlobalSearch('us');
    cy.wait(1000);
    cy.get('[data-testid="MenuTitle__147"]').click();
    cy.wait(1000);
    cy.clickNewRecord()
    cy.wait(1000);

    cy.get('input[name="name"]').should('be.visible').as('nameInput')

    cy.get('@nameInput').clear()

    cy.get('input[name="name"]').should('be.visible').type(name)

    cy.get('input[name="username"]')
      .should('be.visible')
      .clear()
      .type(username);

    cy.get('input[name="password"]').click().clear().then($input => {
      [...pwd].forEach(ch => {
        cy.wrap($input).type(ch, { delay: 120 });
      });
    });

    cy.get('input[name="password"]').should('have.value', pwd).blur();
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(1000);
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(1000);
    cy.get('button[aria-label="User Roles"]').click();

    cy.wait(1000);
    cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
    cy.wait(1000);
    cy.get('[aria-describedby="Role-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.wait(1000);
    cy.get('[data-testid="OptionItem__FA057013C10148828D2430F66F42EF1A"] > .truncate').click();
    cy.wait(1000);

    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(1000);
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(1000);
    cy.get('[data-testid="PersonIcon__120cc9"] > path').click();
    cy.wait(1000);
    cy.get('[data-testid="IconButton__d71b83"]').click();
    cy.wait(1000);
    cy.loginToEtendo(username, pwd, { useSession: false });
    cy.wait(1000);
    cy.get('[data-testid="MenuTitle__166"] > .flex.overflow-hidden > .relative > .ml-2').should('be.visible');


  });
});