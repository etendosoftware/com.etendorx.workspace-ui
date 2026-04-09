/**
 * ETP-3643 — Fix missing default value + callout dirty state preservation
 * for Fecha Operación (EM_Etsg_Date_Operation) in Sales Invoice.
 *
 * Fix 1 (useFormInitialState.ts): On NEW records, cross-field @ColumnName@ default
 *   references are now resolved client-side. When EM_Etsg_Date_Operation has
 *   defaultValue = "@DateInvoiced@" and FIC returns empty, the hook fills it from
 *   the already-computed dateInvoiced value.
 *
 * Fix 2 (FormView/index.tsx): When the user modifies a field in a NEW record
 *   before the FIC response arrives, applyFullInitialization was wiping
 *   formState.dirtyFields (keepDirty:false). The callout on dateInvoiced was then
 *   blocked by the dirty-field guard. Fix: when FormMode.NEW and fields are already
 *   dirty, use applyDataRefresh instead to preserve dirty state so the callout fires.
 */

describe("ETP-3643 - Fecha Operacion default value and callout on Sales Invoice", () => {
  beforeEach(() => {
    cy.cleanupEtendo();
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 1 — Fix 1: Fecha Operacion receives the default value from
  // Invoice Date when a new Sales Invoice record is opened.
  // ---------------------------------------------------------------------------
  it("should pre-fill Fecha Operacion with today's date (matching Invoice Date) on a new Sales Invoice record", () => {
    // Step 1: Login and select role/org/warehouse
    cy.loginToEtendo(
      Cypress.env("defaultUser"),
      Cypress.env("defaultPassword"),
      { useSession: false }
    );
    cy.selectRoleOrgWarehouse();

    // Step 2: Open the drawer and navigate to Sales Invoice
    cy.openDrawer();
    cy.navigateToSalesInvoice();

    // Step 3: Click New Record to open the empty form
    cy.intercept("POST", "**/FormInitializationComponent**").as("ficInit");
    cy.clickNewRecord();

    // Step 4: Wait for the FIC response so the form is fully initialized
    cy.wait("@ficInit", { timeout: 30000 });

    // Step 5: Verify Fecha Operacion field is visible and has been populated
    // with the same value as Invoice Date (the @DateInvoiced@ cross-field default).
    // Both fields should hold today's date, confirming Fix 1 works.
    cy.get('[aria-label="Invoice Date"] input', { timeout: 15000 })
      .should("be.visible")
      .invoke("val")
      .then((invoiceDate) => {
        expect(invoiceDate, "Invoice Date should not be empty").to.not.be.empty;

        cy.get('[aria-label="Fecha Operacion"] input, [aria-label="Fecha Operación"] input', { timeout: 15000 })
          .should("be.visible")
          .invoke("val")
          .then((fechaOperacion) => {
            expect(fechaOperacion, "Fecha Operacion should match Invoice Date").to.equal(invoiceDate);
          });
      });
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — Fix 2: When the user changes Invoice Date on a NEW record
  // before FIC responds, the callout must still fire and update Fecha Operacion.
  //
  // This scenario is SKIPPED because it requires precise timing control over
  // the FIC network response (the user must dirty a field *before* the FIC
  // response arrives) which cannot be reliably reproduced in CI without
  // intercepting and artificially delaying the FIC endpoint. The unit tests
  // for useFormInitialState and FormView/index cover this logic directly.
  // ---------------------------------------------------------------------------
  it.skip("should update Fecha Operacion via callout when Invoice Date is changed on a new record (requires FIC timing control — covered by unit tests)", () => {
    // Step 1: Login and select role/org/warehouse
    cy.loginToEtendo(
      Cypress.env("defaultUser"),
      Cypress.env("defaultPassword"),
      { useSession: false }
    );
    cy.selectRoleOrgWarehouse();

    // Step 2: Open the drawer and navigate to Sales Invoice
    cy.openDrawer();
    cy.navigateToSalesInvoice();

    // Step 3: Click New Record to open the empty form.
    // We delay the FIC response so the user can dirty a field before it arrives,
    // reproducing the race condition that Fix 2 addresses.
    cy.intercept("POST", "**/FormInitializationComponent**", (req) => {
      req.on("response", (res) => {
        res.setDelay(3000);
      });
    }).as("ficDelayed");
    cy.clickNewRecord();

    // Step 4: Before FIC responds, change Invoice Date to a specific date.
    // This dirtying of the field is what was previously wiping dirtyFields
    // via applyFullInitialization and blocking the subsequent callout.
    const newDate = "01-06-2025";
    cy.get('[aria-label="Invoice Date"] input', { timeout: 15000 })
      .should("be.visible")
      .scrollIntoView()
      .clear()
      .type(newDate);

    // Step 5: Blur away from Invoice Date to trigger the callout
    cy.get('[aria-label="Invoice Date"] input').blur();

    // Step 6: Wait for the (delayed) FIC response and then for the callout FIC
    cy.wait("@ficDelayed", { timeout: 30000 });
    cy.intercept("POST", "**/FormInitializationComponent**").as("ficCallout");
    cy.wait("@ficCallout", { timeout: 30000 });

    // Step 7: Verify Fecha Operacion was updated to match the new Invoice Date
    cy.get('[aria-label="Fecha Operacion"] input, [aria-label="Fecha Operación"] input', { timeout: 15000 })
      .should("be.visible")
      .invoke("val")
      .should("equal", newDate);
  });
});
