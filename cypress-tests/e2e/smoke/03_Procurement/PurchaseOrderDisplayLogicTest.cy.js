describe('Purchase Order - Display logic and field visibility', () => {
  beforeEach(() => {
    cy.cleanupEtendo()
    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors that don't affect the tests
      return !err.message.includes('Hydration failed');
    });

  })

  it('Displays required fields and hides delivery notes according to display logic', () => {
    cy.loginToEtendo('admin', 'admin', { useSession: false })
    cy.wait(500)

    cy.get('.h-14 > div > .transition > svg').click()
    cy.wait(500)

    cy.typeInGlobalSearch('sales')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__129"]').click()
    cy.wait(500)

    cy.clickNewRecord();
    cy.get('[aria-describedby="Organization-help"] > .w-1\\/3 > .overflow-hidden').should('be.visible');
    cy.get('[aria-describedby="Transaction Document-help"] > .w-1\\/3 > .overflow-hidden').should('be.visible');
    cy.get('[aria-describedby="Document No.-help"] > .w-1\\/3 > .overflow-hidden').should('be.visible');
    cy.get('[aria-describedby="Delivery Notes-help"]').should('not.exist')

  })
})
