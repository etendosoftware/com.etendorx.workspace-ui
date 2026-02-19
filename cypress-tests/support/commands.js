// Reusable login command
Cypress.Commands.add('loginToEtendo', (username = Cypress.env('defaultUser') || 'admin', password = Cypress.env('defaultPassword') || 'admin', options = {}) => {
  const { useSession = true, baseUrl = Cypress.config('baseUrl') } = options

  const loginFlow = () => {
    cy.visit(baseUrl)

    // Wait for the login page to load
    cy.get('#username', { timeout: 10000 }).should('be.visible')

    // Clear and type username
    cy.get('#username').clear().type(username)
    cy.wait(500)

    // Clear and type password
    cy.get('#password').clear().type(password)
    cy.wait(500)

    // Click login button
    cy.get('[data-testid="Button__602739"]').first().click()
    cy.wait(500)

    // Verify successful login by checking for dashboard elements
    cy.get('.h-14 > div > .transition > svg', { timeout: 10000 }).should('be.visible')
  }

  if (useSession) {
    cy.session([username, password, baseUrl], loginFlow, {
      cacheAcrossSpecs: true
    })
  } else {
    loginFlow()
  }
})

// Command to clear data between tests
Cypress.Commands.add('cleanupEtendo', () => {
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})

// Command to check main interface
Cypress.Commands.add('verifyEtendoInterface', () => {
  cy.get('body').should('be.visible')
  cy.get('body').should('not.contain', 'Log In')
})

// Command to click OK button in legacy iframe popup with wait
Cypress.Commands.add('clickOkInLegacyPopup', () => {
  cy.get(`iframe[src*="${Cypress.env('iframeUrl') || 'classic-new-mainui'}"], iframe[src*="localhost:8080"]`, { timeout: 10000 })
    .should('be.visible')
    .then(($iframe) => {
      cy.wait(500);

      cy.then(() => {
        const iframeDoc = $iframe[0].contentDocument || $iframe[0].contentWindow.document;

        // Function to search for OK in a document
        const findAndClickOK = (doc) => {
          // ⚠️ IMPORTANT: Change the ORDER - search td.Button_text FIRST
          const selectors = [
            'td.Button_text.Button_width',
            'td.Button_text',
            '#buttonOK',
            'button[value="OK"]',
            'input[value="OK"]',
            'input[type="button"][value="OK"]',
            '[onclick*="buttonOK"]'
          ];

          for (const selector of selectors) {
            const elements = doc.querySelectorAll(selector);

            for (const el of elements) {
              const text = el.textContent?.trim() || el.value?.trim() || '';

              // For td, verify it is visible and has text "OK"
              if (selector.includes('td')) {
                const isVisible = el.offsetParent !== null; // Verify visibility
                if (text === 'OK' && isVisible) {
                  el.click();
                  cy.log(`✅ Clicked OK button with selector: ${selector}`);
                  return true;
                }
              } else if (text === 'OK' || selector.includes('buttonOK')) {
                const isVisible = el.offsetParent !== null;
                if (isVisible) {
                  el.click();
                  cy.log(`✅ Clicked OK button with selector: ${selector}`);
                  return true;
                }
              }
            }
          }

          return false;
        };

        // First try in the main document
        if (findAndClickOK(iframeDoc)) {
          return;
        }

        // If not found, search in internal frames
        const frames = iframeDoc.querySelectorAll('frame, iframe');

        for (const frame of frames) {
          try {
            const frameDoc = frame.contentDocument || frame.contentWindow.document;
            if (findAndClickOK(frameDoc)) {
              cy.log(`Found in frame: ${frame.name || 'unnamed'}`);
              return;
            }
          } catch (e) {
            cy.log(`Cannot access frame: ${e.message}`);
          }
        }

        throw new Error('OK button not found in any frame');
      });
    });
});

// Command to capture and extract document number
Cypress.Commands.add(
  'captureDocumentNumber',
  (
    selector = 'p.MuiTypography-root.MuiTypography-body1.MuiTypography-noWrap',
    aliasName = 'orderNumber'
  ) => {
    cy.get(selector, { timeout: 20000 })
      .filter(':visible')
      .then($els => {
        const elWithNumber = [...$els].find(el => /\d+/.test(el.innerText));
        if (!elWithNumber) {
          throw new Error(
            `Could not find any visible element with a document number. Texts: [${[...$els]
              .map(e => `"${e.innerText.trim()}"`)
              .join(', ')}]`
          );
        }
        return elWithNumber.innerText;
      })
      .then(fullText => fullText.replace(/\s+/g, ' ').trim())
      .then(fullText => {
        const match = fullText.match(/(\d+)/);
        if (!match) {
          throw new Error(`Could not parse Document No from: "${fullText}"`);
        }

        const docNo = match[1];
        cy.wrap(docNo).as(aliasName);
        cy.log(`📄 Captured ${aliasName}: ${docNo} (from "${fullText}")`);
      });
  }
);



// Command to select role, organization and warehouse
Cypress.Commands.add('selectRoleOrgWarehouse', (options = {}) => {
  const {
    roleOptionId = '#role-select-option-12',
    organizationOptionId = '#organization-select-option-3',
    warehouseOptionId = '#warehouse-select-option-1'
  } = options

  // Switch to role selection
  cy.get('[data-testid="PersonIcon__120cc9"]').click();
  cy.wait(500);

  // Open role dropdown
  cy.get(
    ':nth-child(1) > .MuiFormControl-root > .MuiInputBase-root > [style="display: flex; align-items: center;"] > .MuiAutocomplete-endAdornment > .MuiAutocomplete-popupIndicator > [data-testid="ExpandMoreIcon"]'
  ).click();
  cy.wait(500);

  // Select role
  cy.get(`${roleOptionId} > .MuiTypography-root`).click();
  cy.wait(500);

  // Select organization
  cy.get('#organization-select').click();
  cy.wait(500);
  cy.get(`${organizationOptionId} > .MuiTypography-root`).click();
  cy.wait(500);

  // Select warehouse
  cy.get('#warehouse-select').click();
  cy.get(`${warehouseOptionId} > .MuiTypography-root`).click();

  cy.get('.PrivateSwitchBase-input').check();
  cy.wait(500);

  cy.get('.text-\\(--color-etendo-contrast-text\\) > :nth-child(2)').click();
})

/**
 * Navigate to Goods Shipment
 */
Cypress.Commands.add('navigateToGoodsShipment', () => {
  cy.get('#_r_1_').clear();
  cy.wait(500);
  cy.get('#_r_1_').type('goods S');
  cy.wait(500);
  cy.get('[data-testid="MenuTitle__180"] > .flex.overflow-hidden > .relative > .ml-2').click();
});

/**
 * Navigate to Sales Invoice
 */
Cypress.Commands.add('navigateToSalesInvoice', () => {
  cy.get('#_r_1_').clear();
  cy.wait(500);
  cy.get('#_r_1_').type('sales i');
  cy.wait(500);
  cy.get('[data-testid="MenuTitle__178"] > .flex.overflow-hidden > .relative > .ml-2').click();
});

Cypress.Commands.add('clickNewRecord', () => {
  cy.contains('button', 'New Record', { timeout: 20000 })
    .filter(':visible')
    .not(':disabled')
    .first()
    .click();
});
Cypress.Commands.add('typeName', (text) => {
  cy.get('input[aria-label="Name"]', { timeout: 20000 })
    .should('have.length', 1)
    .clear()
    .type(text);
});

Cypress.Commands.add('getCreateFromInnerBody', () => {
  return cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 30000 })
    .should('exist')
    .then($outer => {
      const outerDoc = $outer[0].contentDocument;
      expect(outerDoc).to.exist;

      let innerCreateFrom = outerDoc.querySelector('iframe[src*="ad_actionButton/CreateFrom"]');

      const getDeepDocFromFrame = (frameEl) => {
        const deepDoc = frameEl.contentDocument || frameEl.contentWindow?.document;
        expect(deepDoc, 'deep frame document').to.exist;

        // ✅ WAIT until body exists (not null) and has content
        return cy.wrap(deepDoc, { log: false })
          .its('body', { timeout: 30000 })
          .should('not.be.null')
          .then((body) => cy.wrap(body).should('not.be.empty'));
      };

      if (innerCreateFrom) {
        const innerDoc = innerCreateFrom.contentDocument;
        const frames = innerDoc.getElementsByTagName('frame');
        expect(frames.length).to.be.greaterThan(0);

        const targetFrame = Array.from(frames).find(f =>
          /CreateFrom_F1\.html/i.test(f.src || '')
        ) || frames[0];

        return getDeepDocFromFrame(targetFrame);
      } else {
        const frames = outerDoc.getElementsByTagName('frame');
        expect(frames.length, 'frames inside legacy popup').to.be.greaterThan(0);

        const targetFrame = Array.from(frames).find(f =>
          /CreateFrom_F1\.html/i.test(f.src || '')
        ) || frames[0];

        return getDeepDocFromFrame(targetFrame);
      }
    });
});


Cypress.Commands.add('interactWithLegacyIframe', (callback) => {
  cy.get(`iframe[src*="${Cypress.env('iframeUrl')}"]`, { timeout: 10000 })
    .should('exist')
    .then(($iframe) => {
      cy.wait(1500)
      cy.then(() => {
        const iframeDoc = $iframe[0].contentDocument
        const framesetMenu = iframeDoc.querySelector('#framesetMenu')

        if (framesetMenu) {
          const frames = iframeDoc.querySelectorAll('frame')
          for (const frame of frames) {
            if (callback(frame.contentDocument, frame.name)) {
              return
            }
          }
        }

        callback(iframeDoc, 'main')
      })
    })
})

Cypress.Commands.add('setLegacyDate', (fieldId = 'paramDateFrom') => {
  cy.interactWithLegacyIframe((doc, frameName) => {
    const dateInput = doc.getElementById(fieldId)
    if (dateInput) {
      const today = new Date()
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`

      dateInput.value = formattedDate
      const targetWindow = dateInput.ownerDocument.defaultView
        ;['input', 'change', 'blur'].forEach(e =>
          dateInput.dispatchEvent(new targetWindow.Event(e, { bubbles: true, cancelable: true }))
        )

      cy.log(`✅ Date: ${formattedDate}`)
      return true
    }
    return false
  })
  cy.wait(1000)
})

Cypress.Commands.add('clickLegacyButton', (buttonText) => {
  cy.interactWithLegacyIframe((doc) => {
    const buttons = doc.querySelectorAll('td.Button_text, button, input[type="button"]')
    for (const btn of buttons) {
      if (btn.textContent.trim() === buttonText || btn.value === buttonText) {
        btn.click()
        cy.log(`✅ ${buttonText} clicked`)
        return true
      }
    }
    return false
  })
  cy.wait(1500)
})

Cypress.Commands.add('selectLegacyCheckboxes', (checkboxName = 'inpOrder', leaveLastUnchecked = true) => {
  cy.interactWithLegacyIframe((doc) => {
    const checkboxes = doc.querySelectorAll(`input[type="checkbox"][name="${checkboxName}"]`)
    if (checkboxes.length > 0) {
      const limit = leaveLastUnchecked ? checkboxes.length - 1 : checkboxes.length
      checkboxes.forEach((cb, i) => { if (i < limit) cb.click() })
      cy.log(`✅ Selected ${limit}/${checkboxes.length}`)
      return true
    }
    return false
  })
  cy.wait(1500)
})

Cypress.Commands.add('verifyLegacySuccessMessage', (expectedMessage = 'Process completed successfully') => {
  cy.interactWithLegacyIframe((doc, frameName) => {
    const messageTitle = doc.querySelector('.MessageBox_TextTitle#messageBoxIDTitle')

    if (messageTitle) {
      const messageText = messageTitle.textContent.trim()

      if (messageText === expectedMessage) {
        cy.log(`✅ ${expectedMessage} (in ${frameName})`)
        return true
      } else {
        throw new Error(`Expected "${expectedMessage}" but got "${messageText}"`)
      }
    }
    return false
  })

  cy.wait(1000)
})


// Set invoice date in legacy popup and generate
Cypress.Commands.add('setInvoiceDateAndGenerate', () => {
  cy.interactWithLegacyIframe((doc, frameName) => {
    const dateInput = doc.getElementById('DateInvoiced')

    if (dateInput) {
      const today = new Date()
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`

      dateInput.value = formattedDate

      const targetWindow = dateInput.ownerDocument.defaultView
        ;['input', 'change', 'blur'].forEach(eventType => {
          dateInput.dispatchEvent(new targetWindow.Event(eventType, { bubbles: true, cancelable: true }))
        })

      cy.log(`✅ Invoice date set to: ${formattedDate} in ${frameName}`)
      return true
    }
    return false
  })

  cy.wait(1500)

  // Click on OK/Generate button
  cy.clickLegacyButton('OK')
})

Cypress.Commands.add('selectDocumentInAddPayment', (documentAlias = 'documentNumber', type = 'invoice') => {
  cy.get(`@${documentAlias}`).then((documentNumber) => {
    const placeholder = type === 'order'
      ? 'Filter by Order No.'
      : 'Filter by Invoice No.';

    cy.log(`Searching for ${type} ${documentNumber} in Add Payment popup`);

    // ✅ WAIT for the modal to be completely visible
    cy.get(`input[placeholder="${placeholder}"]`, { timeout: 10000 })
      .should('be.visible')
      .should('not.be.disabled');

    cy.wait(1000);

    // filter by document
    cy.get(`input[placeholder="${placeholder}"]`)
      .clear()
      .type(documentNumber, { delay: 100 });

    cy.wait(1000);

    // ensure there is a row
    cy.get('tbody tr', { timeout: 10000 })
      .should('have.length.at.least', 1);

    cy.wait(500);

    // Click on the cell containing the number
    cy.contains('.MuiTableCell-root', documentNumber, { timeout: 10000 })
      .click({ force: true, multiple: true });

    cy.wait(500);
  });
});

Cypress.Commands.add('typeInGlobalSearch', (text) => {
  cy.get('input[placeholder="Search"]', { timeout: 10000 })
    .filter(':visible')
    .first()
    .should('be.visible')
    .click()
    .clear()
    .type(text);
});

Cypress.Commands.add('clickSave', () => {
  cy.get('button.toolbar-button-save', { timeout: 60000 })
    .filter(':visible')
    .should(($btns) => {
      const enabled = $btns.filter(':not(:disabled)');
      expect(enabled.length, 'enabled save button visible').to.be.greaterThan(0);
    })
    .then(($btns) => {
      cy.wrap($btns.filter(':not(:disabled)').first()).click();
    });
});


Cypress.Commands.add('closeToastIfPresent', () => {
  const toastClose = '[data-testid^="SuccessCloseButton__"]';

  cy.get('body', { timeout: 20000 }).then($body => {
    if ($body.find(toastClose).length) {
      cy.get(toastClose)
        .should('be.visible')
        .click({ force: true });
    }
  });
  cy.get(toastClose, { timeout: 20000 }).should('not.exist');
});

Cypress.Commands.add('closeSuccessOverlay', () => {
  const modalText = 'Process completed successfully';
  const closeButton = '[data-testid^="SuccessCloseButton__761503"]';
  const closeIcon = '[aria-label="Close"]';

  cy.contains(modalText, { timeout: 60000 })
    .should('be.visible')
    .wait(1000);

  cy.get('body').then($body => {
    if ($body.find(closeButton).length > 0) {
      cy.get(closeButton).click({ force: true });
    } else {
      cy.get(closeIcon).click({ force: true });
    }
  });

  cy.contains(modalText).should('not.exist');
});

