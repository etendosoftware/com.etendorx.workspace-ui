describe("Financial Test 2 - Sales Invoice to Payment In", () => {
  beforeEach(() => {
    cy.cleanupEtendo();

    cy.on("uncaught:exception", (err) => {
      return !err.message.includes("Hydration failed");
    });
  });

  it("Creates Sales Invoice, completes it, creates Payment In and links the invoice", () => {
    cy.loginToEtendo(Cypress.env("defaultUser"), Cypress.env("defaultPassword"), { useSession: false });
    cy.wait(500);

    cy.selectRoleOrgWarehouse();

    // -------------------------
    // Step 1: Navigate to Sales Invoice
    // -------------------------
    cy.get(".h-14 > div > .transition > svg").click();
    cy.wait(500);

    cy.typeInGlobalSearch("sales i");
    cy.wait(500);

    cy.get('[data-testid="MenuTitle__178"] > .flex.overflow-hidden > .relative > .ml-2').click();
    cy.wait(500);

    // -------------------------
    // Step 2: Create New Sales Invoice
    // -------------------------
    cy.clickNewRecord();
    cy.wait(500);

    cy.contains("Main Section").should("be.visible");

    // Business Partner: Customer A
    cy.get('[aria-describedby="Business Partner-help"]')
      .find('div[tabindex="0"]')
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Customer A", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Customer A$/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });
    cy.wait(500);

    // Save header to populate defaults
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // Save all header fields
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // Verify Draft status
    cy.contains(".MuiChip-label", "Draft", { timeout: 10000 }).should("exist");

    // -------------------------
    // Step 3: Add Invoice Line
    // -------------------------
    cy.get('button[aria-label="Lines"]').click();
    cy.wait(500);

    cy.clickNewRecord();
    cy.wait(500);

    // Product: Final good A
    cy.get('[data-testid="ChevronDown__2996"]').scrollIntoView().click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Final good", { delay: 0, force: true });

    cy.intercept("POST", /FormInitializationComponent/).as("productFormInit");
    cy.contains('[data-testid^="OptionItem__"]', /Final good A/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });
    cy.wait("@productFormInit", { timeout: 60000 });

    // Invoiced Quantity: 13.13
    cy.get('[data-testid="TextInput__2999"]').clear({ force: true });
    cy.wait(500);
    cy.get('[data-testid="TextInput__2999"]').type("13,13", { force: true });
    cy.wait(500);

    // Save line
    cy.get("button.toolbar-button-save").eq(1).click();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // Verify Net Amount: 26.26
    cy.contains("26.26").should("be.visible");

    // -------------------------
    // Step 4: Complete Sales Invoice
    // -------------------------
    cy.contains("button", "Available Process").click();
    cy.wait(500);

    cy.get(".rounded-2xl > :nth-child(1)").click();
    cy.wait(500);

    cy.get(".h-\\[625px\\] > .items-center > .font-semibold").should("be.visible");
    cy.wait(500);

    cy.clickOkInLegacyPopup();
    cy.wait(500);

    cy.get(".mb-1", { timeout: 10000 }).should("have.text", "Process completed successfully");
    cy.wait(500);

    cy.get('[data-testid="close-button"]').click();
    cy.closeToastIfPresent();
    cy.wait(500);

    // Refresh and verify Completed status
    cy.get("button.toolbar-button-refresh").filter(":visible").first().should("be.enabled").click();
    cy.wait(1000);

    // Capture invoice number for later use
    cy.captureDocumentNumber(undefined, "invoiceNumber");
    cy.wait(500);

    // -------------------------
    // Step 5: Navigate to Payment In
    // -------------------------
    cy.typeInGlobalSearch("payment");
    cy.wait(500);

    cy.contains('[data-testid^="MenuTitle__"]', "Payment In", { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);

    // -------------------------
    // Step 6: Create new Payment In
    // -------------------------
    cy.clickNewRecord();
    cy.wait(500);

    cy.contains("Main Section").should("be.visible");

    // Received From (Business Partner): Customer A
    cy.get('[data-testid="ChevronDown__7C541AC0C75CFDD7E040007F01016B4D"]').scrollIntoView().click({ force: true });
    cy.wait(500);

    cy.get('input[aria-label="Search options"]', { timeout: 10000 })
      .should("be.visible")
      .clear({ force: true })
      .type("Customer A", { delay: 0, force: true });

    cy.contains('[data-testid^="OptionItem__"]', /^Customer A$/, { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });
    cy.wait(500);

    // Save to populate defaults
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // Amount: 28.92
    cy.get('[data-testid="TextInput__329fab"]').scrollIntoView().clear({ force: true }).type("28,92", { force: true });
    cy.wait(500);

    // Save Payment In
    cy.clickSave();
    cy.wait(500);
    cy.closeToastIfPresent();
    cy.wait(500);

    // Verify Status: Awaiting Payment
    cy.get('span[name="status"]', { timeout: 10000 }).should("be.visible").and("have.text", "Awaiting Payment");

    // Capture payment document number
    cy.captureDocumentNumber(undefined, "paymentNumber");
    cy.wait(500);

    // -------------------------
    // Step 7: Open Add Details process
    // -------------------------
    cy.get('[data-testid="IconButtonWithText__process-menu"]').click();
    cy.wait(500);

    cy.get('[data-testid="ProcessMenuItemBase__541926"]').click();
    cy.wait(500);

    // Search for the invoice created earlier
    cy.get("@invoiceNumber").then((invoiceNumber) => {
      cy.get('input[placeholder="Filter Invoice No...."]', { timeout: 10000 })
        .should("be.visible")
        .clear()
        .type(`${invoiceNumber}{enter}`, { force: true });
      cy.wait(1000);

      // Select the invoice checkbox (click the row to select it)
      cy.contains("td", invoiceNumber, { timeout: 10000 })
        .parent("tr")
        .find('input[aria-label="Toggle select row"]')
        .click({ force: true });
      cy.wait(500);
    });

    cy.get("tbody.MuiTableBody-root tr.MuiTableRow-root", { timeout: 30000 }).should("have.length.gte", 1);

    cy.get('div[aria-label="Action Regarding Document"]', { timeout: 10000 })
      .scrollIntoView()
      .should("be.visible")
      .find('div[tabindex="0"]')
      .should("not.be.disabled")
      .click();

    cy.get('div[data-dropdown-portal] li[data-testid^="OptionItem__"]', { timeout: 15000 }).should(
      "have.length.gte",
      1
    );

    cy.contains('li[data-testid^="OptionItem__"] span', "Process Received Payment(s)", { timeout: 20000 })
      .should("be.visible")
      .click();

    cy.get('[data-testid="ExecuteButton__761503"]').click();

    cy.get('[data-sonner-toast][data-type="success"]', { timeout: 30000 }).should("be.visible");
    cy.closeToastIfPresent();
    cy.wait(500);

    cy.get("button.toolbar-button-refresh").filter(":visible").first().should("be.enabled").click();
    cy.wait(1000);

    // Verify Status: Payment Received
    cy.get('[data-testid="status-bar-container"] span[name="status"]', { timeout: 10000 })
      .should("be.visible")
      .and("have.text", "Payment Received");

    // Verify Generated Credit: 1.74
    cy.get('[data-testid="status-bar-container"] span[name="generatedCredit"]', { timeout: 10000 })
      .should("be.visible")
      .and("have.text", "1.74");
  });
});
