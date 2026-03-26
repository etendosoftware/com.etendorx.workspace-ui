describe("Financial - Payment Proposal - Select Expected Payments", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      if (err.message.includes("Hydration failed")) return false;
      if (err.message.includes("ResizeObserver loop")) return false;
      return true;
    });
  });

  it("Creates a Payment Proposal, opens Select Expected Payments and searches 10000015", () => {
    cy.loginToEtendo("admin", "admin", { useSession: false });

    cy.selectRoleOrgWarehouse();

    cy.get(".h-14 > div > .transition > svg").click();
    cy.wait(500);

    cy.typeInGlobalSearch("payment prop");
    cy.wait(500);

    cy.contains('[data-testid^="MenuTitle__"]', "Payment Proposal", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    cy.contains("button", "Available Process").click();
    cy.wait(500);

    cy.contains("div.cursor-pointer", "Select Expected Payments").should("be.visible").click();

    cy.wait(15000);

    cy.get("body").then(($body) => {
      const bodyText = $body.text();
      const hasError = bodyText.includes("errors.missingData") || bodyText.includes("missingData");

      cy.log(`Error: ${hasError}`);

      expect(hasError, "Should not show errors.missingData").to.be.false;

      cy.get('input[placeholder="Filter Invoice Document No...."]', { timeout: 10000 })
        .should("be.visible")
        .click()
        .clear()
        .type("10000015", { force: true, delay: 150 });
      cy.wait(2000);

      cy.contains("tbody.MuiTableBody-root tr", "10000015", { timeout: 30000 }).should("exist");

      cy.log("Record 10000015 found");
    });
  });
});
