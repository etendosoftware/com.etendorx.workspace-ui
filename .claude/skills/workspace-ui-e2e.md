---
name: workspace-ui-e2e
description: Estructura, convenciones y patrones para generar tests E2E Cypress en Etendo WorkspaceUI. Usado por Argos cuando el proyecto tiene cypress-tests/.
---

# Etendo WorkspaceUI — Cypress E2E Test Generation

## Repository Structure
```
cypress-tests/
  cypress.config.js           → baseUrl: http://localhost:3000, specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}"
  e2e/
    smoke/
      00_Login/               → prefix: LGN
      01_Sales/               → prefix: SAL
      03_Procurement/         → prefix: PRO
      04_Masterdata/          → prefix: ADM
      05_Financial/           → prefix: FIN
      06_filters/             → prefix: FLT
      07_LinkedItems/         → prefix: LNK
  support/
    commands.js               → custom Cypress commands (read before generating)
  fixtures/
```

## File Naming
`<PREFIX><LETTER><TestName>.cy.js`

Examples: `LNKaLinkedItemsNavigationTest.cy.js`, `SALaOrderToInvoiceTest.cy.js`

For a new feature category: create new folder `NN_CategoryName/` and define a new prefix.

## Decision Logic

### Branch Type
- `hotfix/ETP-*` → do NOT generate unless explicitly requested in task context
- `feature/ETP-*` → generate ONLY if the feature is entirely new (new screen, new module, new workflow)

### Skip Conditions
- Behavior already fully covered by an existing test
- Change is purely cosmetic (CSS, colors, spacing, no behavior change)
- Change affects only types, constants, or internal utilities with no UI impact
- Feature requires complex backend data setup not reproducible in CI

## Test Template
```javascript
describe("<Feature or Flow Name>", () => {
  beforeEach(() => {
    cy.cleanupEtendo();
    cy.on("uncaught:exception", () => { return false; });
  });

  it("<what this test verifies>", () => {
    cy.loginToEtendo(
      Cypress.env("defaultUser"),
      Cypress.env("defaultPassword"),
      { useSession: false }
    );
    cy.selectRoleOrgWarehouse();

    // Step 1: Navigate to feature
    // Step 2: Perform action
    // Step 3: Assert result
  });
});
```

## Available Custom Commands
| Command | Purpose |
|---------|---------|
| `cy.loginToEtendo(user, pass, { useSession })` | Login with optional session caching |
| `cy.cleanupEtendo()` | Clear cookies, localStorage, sessionStorage |
| `cy.selectRoleOrgWarehouse(options)` | Select role, org, warehouse |
| `cy.openDrawer()` | Open navigation sidebar |
| `cy.typeInGlobalSearch(text)` | Type in main search input |
| `cy.clickSave()` | Click enabled save button |
| `cy.clickNewRecord()` | Click New Record button |
| `cy.captureDocumentNumber(selector, alias)` | Capture document number to alias |
| `cy.openProcessMenu(count, name, retries)` | Open process dropdown and select |
| `cy.clickOkInLegacyPopup()` | Click OK in legacy iframe modal |
| `cy.verifyLegacySuccessMessage(msg)` | Verify success message in legacy iframe |
| `cy.interactWithLegacyIframe(callback)` | Access content inside legacy iframe |
| `cy.clickLegacyButton(text)` | Click button by text in legacy iframe |
| `cy.setLegacyDate(fieldId)` | Set today's date in legacy date field |
| `cy.closeToastIfPresent()` | Close visible toast notification |
| `cy.closeSuccessOverlay()` | Wait for and close process success overlay |
| `cy.openAdvancedFilters()` | Open Advanced Filters panel |
| `cy.waitForSelectExpectedPaymentsData(retries)` | Wait for payment selection data |

## Patterns
- Use `cy.intercept("POST", "**/EndpointName**").as("alias")` BEFORE triggering API calls
- Use `cy.wait("@alias")` immediately after the triggering action
- Always `.scrollIntoView()` before `.click()` on elements below the fold
- Use `{ timeout: 15000 }` for elements requiring server response
- Use `cy.contains('[data-testid^="prefix"]', "text")` for dynamic test IDs
- Avoid `cy.wait(<ms>)` — prefer intercepts and assertions
- Use `cy.get('.MuiTableContainer-root').scrollTo('right')` for horizontal scroll tables
- Comment each logical step with `// Step N: description`

## Commit Format
```
Feature ETP-XXXX: [e2e] add Cypress test for <description>

Co-Authored-By: Argos <noreply@anthropic.com>
```

## Rules
1. Always read ALL existing test files before deciding to generate
2. Never generate a test that duplicates an existing scenario
3. Never execute tests — generation only
4. Use only existing custom commands; do not define new ones
5. One describe block per file; one primary it block per scenario
6. Files must be JavaScript (.cy.js), not TypeScript
7. Steps must be commented clearly
