import './commands.js'
import "cypress-real-events/support"


Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  if (err.message.includes('Hydration failed')) {
    return false
  }
  // Handle React minified errors and DOM manipulation errors
  if (err.message.includes('Minified React error') ||
    err.message.includes('removeChild') ||
    err.message.includes('Failed to execute')) {
    return false
  }
  return true
})

beforeEach(() => {
  cy.viewport(1280, 720)
})
