describe.skip('Sales Orders - Create, Complete Shipment and Invoice', () => {
  beforeEach(() => {
    cy.cleanupEtendo()
  })

  it('should create a sales order with lines, create goods shipment, complete lines from order, create invoice, complete lines from order and post', () => {
    // Login to Etendo
    cy.loginToEtendo(Cypress.env('defaultUser'), Cypress.env('defaultPassword'), { useSession: false })
    cy.wait(2000)

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
    cy.wait(2000)

    // -------------------------
    // Step 2: Create New Sales Order
    // -------------------------
    cy.get('button.toolbar-button-new')
      .contains('New Record')
      .first()
      .should('be.visible')
      .click()
    cy.wait(2000)

    cy.contains('Main Section').should('be.visible')
    cy.wait(2000)

    // -------------------------
    // Step 3: Fill Sales Order Header
    // -------------------------
    // Select Business Partner
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(2000)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click()
    cy.wait(2000)

    // Select Transaction Document
    cy.get('[aria-describedby="Transaction Document-help"] > .w-2\\/3 > .relative > .w-full').click()
    cy.wait(2000)
    cy.get('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click()
    cy.wait(2000)

    // Save header
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click()
    cy.wait(2000)

    // Select Invoice Terms
    cy.get('[aria-describedby="Invoice Terms-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(2000)
    cy.get('[data-testid="OptionItem__I"] > .truncate').click()
    cy.wait(2000)

    // Save invoice terms
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()

    // -------------------------
    // Step 4: Add Order Lines
    // -------------------------
    cy.wait(2000)
    cy.get('button[aria-label="Lines"]').click()
    cy.wait(2000)

    // Create new line
    cy.get('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]')
      .first()
      .click({ force: true })
    cy.wait(2000)

    // Select Product
    cy.get('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full').click()
    cy.wait(2000)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"] > .truncate').click()
    cy.wait(2000)

    // Update Quantity
    cy.get('[data-testid="TextInput__1130"]').clear()
    cy.wait(2000)
    cy.get('[data-testid="TextInput__1130"]').type('11')
    cy.wait(2000)

    // Save line
    cy.get('[style="height: 50%;"] > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"]').click()

    // -------------------------
    // Step 5: Process the Order (Book)
    // -------------------------
    cy.wait(2000)
    cy.get('[data-testid="IconButtonWithText__process-menu"]')
      .first()
      .click()
    cy.wait(2000)

    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Process Order')
    cy.wait(2000)

    // Book the order
    cy.clickOkInLegacyPopup()
    cy.wait(2000)

    // Verify success message
    cy.get('.mb-1').should('have.text', 'Process completed successfully')
    cy.wait(2000)
    cy.get('[data-testid="close-button"]').click()

    // Reload page(bug)
    cy.reload()

    // -------------------------
    // Step 6: Create Goods Shipment
    // -------------------------
    cy.wait(2000)
    cy.navigateToGoodsShipment()
    cy.wait(2000)

    // Create new shipment
    cy.get('.m-0.flex-1 > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click()
    cy.wait(2000)

    // Select Business Partner
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(2000)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click()
    cy.wait(2000)

    // Save shipment header
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()
    cy.wait(2000)

    // -------------------------
    // Step 7: Add Lines from Sales Order
    // -------------------------
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click()
    cy.wait(2000)
    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.wait(2000)

    // Select last sales order in legacy iframe
    cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 10000 })
      .should('exist')
      .then(($iframe) => {
        const iframeDoc = $iframe[0].contentDocument
        const iframeWindow = $iframe[0].contentWindow

        cy.wrap(iframeDoc.body)
          .find('#inpPurchaseOrder', { timeout: 10000 })
          .should('exist')
          .then(() => {
            const selectElement = iframeDoc.getElementById('inpPurchaseOrder')
            const options = selectElement.options

            // Select last option (excluding the first empty one)
            const lastOptionIndex = options.length - 1
            const lastOption = options[lastOptionIndex]

            cy.log(`Selecting last order: ${lastOption.text} (index: ${lastOptionIndex})`)

            // Set selected index
            selectElement.selectedIndex = lastOptionIndex

            // Trigger change event
            const changeEvent = new iframeWindow.Event('change', {
              bubbles: true,
              cancelable: true
            })
            selectElement.dispatchEvent(changeEvent)

            // Execute onchange if exists
            if (selectElement.onchange) {
              selectElement.onchange.call(selectElement)
            }

            cy.wait(3000)
          })
      })

    // Select Storage Bin (Locator)
    cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 10000 })
      .should('exist')
      .then(($iframe) => {
        const iframeDoc = $iframe[0].contentDocument
        const iframeWindow = $iframe[0].contentWindow

        cy.wrap(iframeDoc.body)
          .find('#paramM_Locator_ID_DES', { timeout: 10000 })
          .should('exist')
          .then(() => {
            const locatorInput = iframeDoc.getElementById('paramM_Locator_ID_DES')

            // Clear field if it has content
            locatorInput.value = ''

            // Type warehouse value
            locatorInput.value = 'L01'

            // Trigger input and change events
            const inputEvent = new iframeWindow.Event('input', {
              bubbles: true,
              cancelable: true
            })
            locatorInput.dispatchEvent(inputEvent)

            const changeEvent = new iframeWindow.Event('change', {
              bubbles: true,
              cancelable: true
            })
            locatorInput.dispatchEvent(changeEvent)

            // Simulate Enter key
            const enterEvent = new iframeWindow.KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            })
            locatorInput.dispatchEvent(enterEvent)

            // Also trigger keyup to complete the sequence
            const enterUpEvent = new iframeWindow.KeyboardEvent('keyup', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            })
            locatorInput.dispatchEvent(enterUpEvent)

            cy.wait(3000)
          })
      })

    // Select checkbox in legacy iframe modal
    cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 10000 })
      .should('exist')
      .then(($iframe) => {
        const iframeDoc = $iframe[0].contentDocument
        const iframeWindow = $iframe[0].contentWindow

        cy.wrap(iframeDoc.body)
          .find('input[type="checkbox"]', { timeout: 10000 })
          .should('exist')
          .then(() => {
            // Find all checkboxes in iframe
            const checkboxes = iframeDoc.querySelectorAll('input[type="checkbox"]')
            cy.log(`Found ${checkboxes.length} checkboxes`)

            // Find data row checkbox (not in header)
            let dataCheckbox = null

            checkboxes.forEach((checkbox, index) => {
              const row = checkbox.closest('tr')
              if (row && !row.querySelector('th')) { // Not a header row
                dataCheckbox = checkbox
                cy.log(`Data checkbox found at index: ${index}`)
              }
            })

            if (!dataCheckbox && checkboxes.length > 0) {
              // If no specific one found, take the last one (usually the data one)
              dataCheckbox = checkboxes[checkboxes.length - 1]
              cy.log('Using last checkbox found')
            }

            if (dataCheckbox) {
              cy.log('Clicking checkbox...')

              // Click checkbox
              dataCheckbox.click()

              // Also mark it programmatically just in case
              dataCheckbox.checked = true

              // Trigger events
              const changeEvent = new iframeWindow.Event('change', {
                bubbles: true,
                cancelable: true
              })
              dataCheckbox.dispatchEvent(changeEvent)

              const clickEvent = new iframeWindow.Event('click', {
                bubbles: true,
                cancelable: true
              })
              dataCheckbox.dispatchEvent(clickEvent)

              cy.log('Checkbox selected successfully')
              cy.wait(1000)
            } else {
              cy.log('No checkbox found')
            }
          })
      })

    // Click OK button in iframe
    cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 10000 })
      .should('exist')
      .then(($iframe) => {
        const iframeDoc = $iframe[0].contentDocument
        // Find OK button by Button_text class
        const okButton = iframeDoc.querySelector('td.Button_text')
        okButton.click()
        cy.wait(2000)
      })

    // Verify success message (note: there's a bug with this message)
    cy.get('.mb-1').should('have.text', 'Process completed successfully')
    cy.get('[data-testid="close-button"]').click()

    // -------------------------
    // Step 8: Process Shipment
    // -------------------------
    cy.wait(2000)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click()
    cy.wait(2000)
    cy.get('.rounded-2xl > :nth-child(2)').click()
    cy.wait(2000)

    // Verify Process Shipment popup
    cy.get('.h-\\[625px\\] > .items-center > .font-semibold').should('have.text', 'Process Shipment Java')
    cy.wait(2000)

    // Click OK button in iframe to process shipment
    cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 10000 })
      .should('exist')
      .then(($iframe) => {
        const iframeDoc = $iframe[0].contentDocument
        const okButton = iframeDoc.querySelector('td.Button_text')
        okButton.click()
        cy.wait(2000)
      })

    cy.get('[data-testid="close-button"]').click()

    // -------------------------
    // Step 9: Create Sales Invoice
    // -------------------------
    cy.navigateToSalesInvoice()
    cy.wait(2000)

    // Create new invoice
    cy.get('.m-0.flex-1 > .bg-\\(linear-gradient\\(180deg\\, > .h-10.gap-1 > :nth-child(1) > [data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click()
    cy.wait(2000)

    // Select Business Partner
    cy.get('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click()
    cy.wait(2000)
    cy.get('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click()
    cy.wait(2000)

    // Save invoice header
    cy.get('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click()
    cy.wait(2000)
    cy.get('[data-testid="BasicModal_CloseIcon"] > path').click()

    // -------------------------
    // Step 10: Add Lines from Goods Shipment
    // -------------------------
    cy.wait(2000)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click()
    cy.wait(2000)
    cy.get('.rounded-2xl > :nth-child(2)').click()
    cy.wait(2000)

    // Select shipment lines
    cy.get('tr[data-index="0"] > .css-br42ok > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.wait(2000)

    // Toggle select all
    cy.get('.Mui-TableHeadCell-Content-Wrapper > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.wait(2000)
    cy.get('.Mui-TableHeadCell-Content-Wrapper > .MuiButtonBase-root > .PrivateSwitchBase-input').uncheck()
    cy.wait(2000)

    // Select specific line
    cy.get('tr[data-index="0"] > .css-br42ok > .MuiButtonBase-root > .PrivateSwitchBase-input').check()
    cy.wait(2000)

    // Confirm selection
    cy.get('.gap-4 > .text-white').click()
    cy.wait(2000)
    cy.get('.gap-4 > .border').click()

    // -------------------------
    // Step 11: Complete Invoice
    // -------------------------
    cy.wait(2000)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click()
    cy.wait(2000)
    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.wait(2000)

    // Complete the invoice
    cy.clickOkInLegacyPopup()
    cy.wait(2000)

    // Verify success message
    cy.get('.mb-1').should('have.text', 'Process completed successfully')
    cy.wait(2000)
    cy.get('[data-testid="close-button"]').click()
    cy.wait(2000)

    // Close invoice
    cy.get('[data-testid="CloseIcon__cfc328"]').click()

    // -------------------------
    // Step 12: Post Invoice
    // -------------------------
    cy.wait(2000)
    cy.get('[data-testid="IconButtonWithText__process-menu"] > span').click()
    cy.wait(2000)
    cy.get('.rounded-2xl > :nth-child(1)').click()
    cy.wait(2000)

    // Post the invoice
    cy.clickOkInLegacyPopup()
    cy.wait(2000)
    cy.get('[data-testid="close-button"]').click()
  })
})
