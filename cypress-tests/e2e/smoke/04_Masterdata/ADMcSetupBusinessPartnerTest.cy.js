describe('Master Data - Business Partner Setup', () => {
  beforeEach(() => {
    cy.cleanupEtendo()
  })

  it('Create payment terms, invoice schedule and configure customer', () => {
    // Login to Etendo
    cy.loginToEtendo(Cypress.env('defaultUser'), Cypress.env('defaultPassword'), { useSession: false })
    cy.wait(500)

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

    cy.get('.h-14 > div > .transition > svg > path').click();
    cy.wait(500)
    cy.typeInGlobalSearch('paym');
    cy.wait(500)
    cy.get('[data-testid="MenuTitle__127"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500)
    cy.clickNewRecord();
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('60d/10');
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('60d/10');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('6');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('60 days');
    cy.wait(500)
    cy.get('[aria-describedby="Offset Month Due-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').clear('02');
    cy.wait(500)
    cy.get('[aria-describedby="Offset Month Due-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').type('2');
    cy.wait(500)
    cy.get('[aria-describedby="Overdue Payment Days Rule-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').click();
    cy.wait(500)
    cy.get('[aria-describedby="Fixed Due Date-help"] > .w-2\\/3 > [data-testid="Switch__756a1e"] > .inline-block').click();
    cy.wait(500)
    cy.get('[aria-describedby="Maturity Date 1-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').clear('1');
    cy.wait(500)
    cy.get('[aria-describedby="Maturity Date 1-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').type('10');
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click();
    cy.wait(500)
    cy.get('[data-testid="CloseIcon__cfc328"]').click();
    cy.wait(500)
    cy.clickNewRecord();
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('1');
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('120d');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('1');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('120 days');
    cy.wait(500)
    cy.get('[aria-describedby="Offset Month Due-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').clear('04');
    cy.wait(500)
    cy.get('[aria-describedby="Offset Month Due-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__329fab"]').type('04');
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(500)
    cy.typeInGlobalSearch('invoi');
    cy.wait(500)
    cy.get('[data-testid="MenuTitle__133"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]').click();
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('S');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('Schedule Weekly');
    cy.wait(500)
    cy.get('[aria-describedby="Invoice Frequency-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.wait(500)
    cy.get('[data-testid="OptionItem__W"]').click();
    cy.wait(500)
    cy.get('[aria-describedby="Day of the Week Cut-off-help"] > .w-2\\/3 > .relative > .w-full').click();
    cy.wait(500)

    cy.get('[data-testid="OptionItem__1"]').click();
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(500)
    cy.typeInGlobalSearch('busine');
    cy.wait(500)
    cy.get('[data-testid="MenuTitle__232"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500)
    cy.clickNewRecord();
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('W');
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('WHS');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('W');
    cy.wait(500)
    cy.get('[aria-describedby="Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('Wholesale');
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();
    cy.wait(500)
    cy.typeInGlobalSearch('busi');
    cy.wait(500)
    cy.get('[data-testid="MenuTitle__110"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500)
    cy.clickNewRecord();
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('G');
    cy.wait(500)
    cy.get('[aria-describedby="Search Key-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('Golden House');
    cy.wait(500)
    cy.get('[aria-describedby="Commercial Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').clear('O');
    cy.wait(500)
    cy.get('[aria-describedby="Commercial Name-help"] > .w-2\\/3 > .font-\\[\\\'Inter\\\'\\] > .relative > [data-testid="TextInput__1e890e"]').type('Oragadam Gold House');
    cy.wait(500)
    cy.get('[aria-describedby="Business Partner Category-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(500)
    cy.get('.fixed > div.p-2 > .w-full').clear('w');
    cy.wait(500)
    cy.get('.fixed > div.p-2 > .w-full').type('wholesale{enter}');
    cy.wait(500)
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click();


  })
})
