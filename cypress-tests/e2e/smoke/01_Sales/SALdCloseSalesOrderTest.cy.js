describe('Sales Orders - Create, Complete and Close', () => {
  beforeEach(() => {
    cy.cleanupEtendo()
  })

  it('should create a sales order, add lines, complete and close it', () => {
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

    cy.get(
      ':nth-child(2) > :nth-child(1) > .transition-all > :nth-child(2) > .hover\\:\\[\\&_img\\]\\:filter-\\[brightness\\(0\\)_saturate\\(100\\%\\)_invert\\(18\\%\\)_sepia\\(40\\%\\)_saturate\\(7101\\%\\)_hue-rotate\\(215deg\\)_brightness\\(91\\%\\)_contrast\\(102\\%\\)\\]'
    ).click()
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
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)

    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click()
    cy.wait(500)

    // Save header
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(500)

    // Close success popup
    cy.get('[data-testid="BasicModal_CloseIcon"]').click()
    cy.wait(500)

    // Capture order number for later use
    cy.captureDocumentNumber()

    // -------------------------
    // Step 4: Add Order Lines
    // -------------------------
    // Navigate to Lines tab
    cy.get('button[aria-label="Lines"]').click();

    cy.wait(500)

    // Create new line
    cy.clickNewRecord();
    cy.wait(500)

    // Select Product
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(500)

    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"] > .truncate').click()
    cy.wait(500)

    // -------------------------
    // Step 5: Update Quantity
    // -------------------------
    cy.get('[data-testid="TextInput__1130"]').clear()
    cy.wait(500)
    cy.get('[data-testid="TextInput__1130"]').type('11')
    cy.wait(500)

    // Save line
    cy.get('button.toolbar-button-save')
      .eq(1)
      .click();
    cy.wait(500)

    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()

    // -------------------------
    // Step 6: Process the Order (Book)
    // -------------------------
    cy.contains('button', 'Available Process').click()
    cy.wait(500)

    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.wait(500)

    // Verify Process Order popup
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Process Order')

    // Book the order
    cy.clickOkInLegacyPopup()
    cy.wait(500)

    cy.get('[data-testid="close-button"]').click()

    // -------------------------
    // Step 7: Search for Created Order and Close It
    // -------------------------
    // Navigate back to order list
    cy.get('.MuiButtonBase-root > .MuiTypography-root').click()

    // Search for the created order
    cy.get('@orderNumber').then((orderNumber) => {
      cy.get('input.w-full[placeholder="Filter Document No...."]').clear()
      cy.get('input.w-full[placeholder="Filter Document No...."]').type(`${orderNumber}{enter}`)
    })
    cy.wait(500)

    // -------------------------
    // Step 8: Close the Order
    // -------------------------
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click()
    cy.wait(500)

    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.wait(500)

    // Verify Process Order popup
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Process Order')
    cy.wait(500)

    // Close the order
    cy.clickOkInLegacyPopup()
    cy.wait(500)

    cy.get('[data-testid="close-button"]').click()
  })
})