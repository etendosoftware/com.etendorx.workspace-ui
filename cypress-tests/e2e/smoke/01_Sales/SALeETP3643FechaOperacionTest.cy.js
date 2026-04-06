/**
 * ETP-3643: Fix missing default value for Fecha Operación field in new UI when creating invoice
 *
 * Verifies that the "Fecha Operación" (etsgDateOperation) field in the
 * "Datos para Sistemas de Facturación" group is automatically populated
 * with the same date as "Fecha" (DateInvoiced) when creating a new invoice.
 *
 * The field only appears when TicketBAI / SIF integration is active
 * (etvfac_has_configuration='Y' OR TBAI_ExistTBAIConfig=1 OR AEATSII_AcogidaSII='Y').
 * If the field is not visible the test is skipped to avoid false failures on
 * environments without the integration configured.
 */
describe("ETP-3643: Fecha Operación auto-populates on new Sales Invoice", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      return !err.message.includes("Hydration failed");
    });
  });

  it("should auto-populate Fecha Operación with DateInvoiced value when creating a new Sales Invoice", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.wait(500);

    cy.selectRoleOrgWarehouse();
    cy.wait(500);

    // -------------------------
    // Navigate to Sales Invoice
    // -------------------------
    cy.get(".h-14 > div > .transition > svg").click();
    cy.wait(500);

    cy.typeInGlobalSearch("sales");
    cy.wait(500);

    cy.get('[data-testid="MenuTitle__178"]').click();
    cy.wait(2000);

    // -------------------------
    // Create new record
    // -------------------------
    cy.get("button.toolbar-button-new").contains("New Record").first().should("be.visible").click();
    cy.wait(2000);

    cy.contains("Main Section").should("be.visible");

    // -------------------------
    // Capture DateInvoiced value (should already be today's date)
    // -------------------------
    cy.get('[aria-describedby="Fecha-help"] > .w-2\\/3 > [data-testid*="TextInput"]')
      .should("be.visible")
      .invoke("val")
      .as("dateInvoicedValue");

    // -------------------------
    // Check if Fecha Operación is visible (requires SIF/TicketBAI config)
    // -------------------------
    cy.get("body").then(($body) => {
      const fieldExists = $body.find('[aria-describedby="Fecha Operación-help"]').length > 0;

      if (!fieldExists) {
        cy.log("Fecha Operación field not visible — TicketBAI/SIF integration not configured. Skipping assertion.");
        return;
      }

      cy.get('[aria-describedby="Fecha Operación-help"]')
        .scrollIntoView()
        .should("be.visible")
        .find("input")
        .first()
        .invoke("val")
        .then((etsgValue) => {
          cy.get("@dateInvoicedValue").then((dateInvoicedValue) => {
            expect(etsgValue, "Fecha Operación should not be empty").to.not.be.empty;
            expect(etsgValue, "Fecha Operación should match DateInvoiced").to.equal(dateInvoicedValue);
          });
        });
    });
  });
});
