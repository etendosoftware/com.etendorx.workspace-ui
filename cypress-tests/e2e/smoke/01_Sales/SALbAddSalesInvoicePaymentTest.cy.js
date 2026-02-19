describe('Sales Order Automation - Complete Flow', () => {
  beforeEach(() => {
    cy.cleanupEtendo()
  })

  it('should create a complete sales order with lines, complete it and add payment', () => {
    // Login to Etendo
    cy.loginToEtendo(Cypress.env('defaultUser'), Cypress.env('defaultPassword'), { useSession: false })
    cy.wait(500)

    // Switch to QA role
    cy.selectRoleOrgWarehouse()

    // -------------------------
    // Step 1: Navigate to Sales Order
    // -------------------------
    cy.get('.h-14 > div > .transition > svg').click()
    cy.wait(500)

    cy.typeInGlobalSearch('sales')
    cy.wait(500)

    cy.get('[data-testid="MenuTitle__129"]').click()
    cy.wait(500)

    // -------------------------
    // Step 2: Create New Sales Order
    // -------------------------
    cy.get('button.toolbar-button-new')
      .contains('New Record')
      .first()
      .should('be.visible')
      .click()
    cy.wait(500)

    cy.contains('Main Section').should('be.visible')

    // -------------------------
    // Step 3: Fill Sales Order Header
    // -------------------------
    // Select Business Partner
    cy.wait(500)
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40C3CB02EC"] > .truncate').click()
    cy.wait(500)

    // Select Transaction Document
    cy.get('[aria-describedby="Transaction Document-help"] > .w-2\\/3 > .relative > .w-full').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click()
    cy.wait(500)

    // Save header
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click()
    cy.wait(500)

    // Select Invoice Terms
    cy.get('[aria-describedby="Invoice Terms-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__I"] > .truncate').click()
    cy.wait(500)

    // Save invoice terms
    cy.clickSave()
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()

    // -------------------------
    // Step 4: Add Order Lines
    // -------------------------
    cy.wait(500)

    // Navigate to Lines tab
    cy.get('button[aria-label="Lines"]').click()
    cy.wait(500)

    // Create new line
    cy.clickNewRecord()
    cy.wait(500)

    // Select Product
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC1D07022A"] > .truncate').click()
    cy.wait(500)

    // Save line
    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(500)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()
    cy.wait(500)

    // -------------------------
    // Step 5: Process the Order (Book)
    // -------------------------
    cy.contains('button', 'Available Process').click()
    cy.wait(500)

    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.wait(500)

    // Verify Process Order popup
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold')
      .should('have.text', 'Process Order')
    cy.wait(500)

    // Book the order
    cy.clickOkInLegacyPopup()
    cy.wait(500)

    // Verify success message
    cy.get('.mb-1').should('have.text', 'Process completed successfully')
    cy.wait(500)

    cy.get('[data-testid="close-button"]').click()
    cy.wait(500)

    // Capture order number for later use
    cy.captureDocumentNumber()
    cy.wait(500)

    cy.get('button.toolbar-button-refresh')
      .filter(':visible')
      .first()
      .should('be.enabled')
      .click()
    cy.wait(2000)

    // -------------------------
    // Step 6: Navigate to Add Payment
    // -------------------------
    cy.contains('button', 'Available Process').click();
    cy.get('.rounded-2xl > :nth-child(1)').click();

    // -------------------------
    // Step 7: Configure Payment Transaction
    // -------------------------

    cy.get('[title="A drop down list box indicating the actions regarding document"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
    cy.wait(500)
    cy.get('[data-testid="OptionItem__7AC4F4FF644247B7BD320BBF67C4F066"] > .truncate').click();
    cy.get('[data-testid="ExecuteButton__761503"]').click();

    //verify payment transaction
    cy.contains('p', /^Created Payment:\s*\d+/)
      .should('be.visible')


  })
})
