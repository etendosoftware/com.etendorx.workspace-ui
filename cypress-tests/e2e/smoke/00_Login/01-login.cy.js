describe('🧪 Login Tests - Etendo', () => {
  beforeEach(() => {
    cy.cleanupEtendo()
    // Ignore hydration errors during testing
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Hydration failed')) {
        return false;
      }
      return true;
    })
  })

  it('should display login page correctly', () => {
    cy.visit('/')

    // Verify login elements
    cy.get("#username").should('be.visible')
    cy.get("#password").should('be.visible')
    cy.get('button').contains('Log In').should('be.visible')

    // Check which fields are empty
    cy.get("#username").should('have.value', '')
    cy.get("#password").should('have.value', '')

  })

  it('should login successfully with valid credentials', () => {
    cy.loginToEtendo(Cypress.env('defaultUser'), Cypress.env('defaultPassword'), { useSession: false })

    // Verify that the main interface loaded
    cy.verifyEtendoInterface()

    cy.log('✅ Successful login with valid credentials')
  })

  it('should handle invalid credentials', () => {
    cy.visit('/')

    // Attempt to log in with invalid credentials
    cy.get('#username').type('invalid')
    cy.get('#password').type('invalid')
    cy.contains('button', 'Log In').click()

    // Verify that the error message is displayed
    cy.contains('Login failed').should('be.visible')

    cy.log('✅ Invalid credentials handled correctly')
  })

})
